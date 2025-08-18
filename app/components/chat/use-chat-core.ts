"use client"

import { useChatDraft } from "@/app/hooks/use-chat-draft"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { toast } from "@/components/ui/toast"
import { getOrCreateGuestUserId } from "@/lib/api"
import { MESSAGE_MAX_LENGTH, SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { Attachment } from "@/lib/file-handling"
import { API_ROUTE_CHAT } from "@/lib/routes"
import type { UserProfile } from "@/lib/user/types"
import type { Message } from "@ai-sdk/react"
import { useChat } from "@ai-sdk/react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { nanoid } from "nanoid" // Import nanoid

type UseChatCoreProps = {
  initialMessages: Message[]
  draftValue: string
  cacheAndAddMessage: (message: Message) => void
  chatId: string | null
  user: UserProfile | null
  files: File[]
  createOptimisticAttachments: (
    files: File[]
  ) => Array<{ name: string; contentType: string; url: string }>
  setFiles: (files: File[]) => void
  checkLimitsAndNotify: (uid: string) => Promise<boolean>
  cleanupOptimisticAttachments: (attachments?: Array<{ url?: string }>) => void
  ensureChatExists: (uid: string, input: string) => Promise<string | null>
  handleFileUploads: (
    uid: string,
    chatId: string
  ) => Promise<Attachment[] | null>
  selectedModel: string
  clearDraft: () => void
  bumpChat: (chatId: string) => void
  isImageGenerationMode: boolean
  setImageGenerationMode: (enabled: boolean) => void
}

export function useChatCore({
  initialMessages,
  draftValue,
  cacheAndAddMessage,
  chatId,
  user,
  files,
  createOptimisticAttachments,
  setFiles,
  checkLimitsAndNotify,
  cleanupOptimisticAttachments,
  ensureChatExists,
  handleFileUploads,
  selectedModel,
  clearDraft,
  bumpChat,
  isImageGenerationMode,
  setImageGenerationMode,
}: UseChatCoreProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasDialogAuth, setHasDialogAuth] = useState(false)
  const [enableSearch, setEnableSearch] = useState(false)
  
  const { preferences } = useUserPreferences()

  const hasSentFirstMessageRef = useRef(false)
  const prevChatIdRef = useRef<string | null>(chatId)
  const isAuthenticated = useMemo(() => !!user?.id, [user?.id])
  const systemPrompt = useMemo(
    () => user?.system_prompt || SYSTEM_PROMPT_DEFAULT,
    [user?.system_prompt]
  )

  const searchParams = useSearchParams()
  const prompt = searchParams.get("prompt")

  const handleError = useCallback((error: Error) => {
    console.error("Chat error:", error)
    console.error("Error message:", error.message)
    let errorMsg = error.message || "Something went wrong."

    if (errorMsg === "An error occurred" || errorMsg === "fetch failed") {
      errorMsg = "Something went wrong. Please try again."
    }

    toast({
      title: errorMsg,
      status: "error",
    })
  }, [])

  const {
    messages,
    input,
    handleSubmit,
    status,
    error,
    reload,
    stop,
    setMessages,
    setInput,
    append,
  } = useChat({
    api: API_ROUTE_CHAT,
    initialMessages,
    initialInput: draftValue,
    body: {
      systemPrompt: preferences.systemPrompt,
      enableSearch: preferences.enableSearch,
    },
    onFinish: cacheAndAddMessage,
    onError: handleError,
  })

  useEffect(() => {
    if (prompt && typeof window !== "undefined") {
      requestAnimationFrame(() => setInput(prompt))
    }
  }, [prompt, setInput])

  if (
    prevChatIdRef.current !== null &&
    chatId === null &&
    messages.length > 0
  ) {
    setMessages([])
  }
  prevChatIdRef.current = chatId

  const submit = useCallback(async () => {
    // Tambahkan logika kondisional di sini
    if (isImageGenerationMode) {
      setIsSubmitting(true)
      const optimisticId = `optimistic-${Date.now().toString()}`

      const userMessage = {
        id: optimisticId,
        content: input,
        role: "user" as const,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")

      try {
        const res = await fetch("/api/image-generation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: userMessage.content, userId: user?.id }),
        })

        if (!res.ok) {
          throw new Error("Failed to generate image")
        }

        const data = await res.json()

        const assistantMessage = {
          id: nanoid(),
          content: "",
          role: "assistant" as const,
          createdAt: new Date(),
          experimental_attachments: [{ url: data.imageUrl, contentType: "image/jpeg", name: "generated-image.jpg" }],
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        toast({ title: "Failed to generate image", status: "error" })
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Logika default untuk chat
      setIsSubmitting(true)
      const uid = await getOrCreateGuestUserId(user)
      if (!uid) {
        setIsSubmitting(false)
        return
      }

      const optimisticId = `optimistic-${Date.now().toString()}`
      const optimisticAttachments =
        files.length > 0 ? createOptimisticAttachments(files) : []

      const optimisticMessage = {
        id: optimisticId,
        content: input,
        role: "user" as const,
        createdAt: new Date(),
        experimental_attachments:
          optimisticAttachments.length > 0 ? optimisticAttachments : undefined,
      }

      setMessages((prev) => [...prev, optimisticMessage])
      setInput("")

      const submittedFiles = [...files]
      setFiles([])

      try {
        const allowed = await checkLimitsAndNotify(uid)
        if (!allowed) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
          cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
          return
        }

        const currentChatId = await ensureChatExists(uid, input)
        if (!currentChatId) {
          setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
          cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
          return
        }

        if (input.length > MESSAGE_MAX_LENGTH) {
          toast({
            title: `The message you submitted was too long, please submit something shorter. (Max ${MESSAGE_MAX_LENGTH} characters)`,
            status: "error",
          })
          setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
          cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
          return
        }

        let attachments: Attachment[] | null = []
        if (submittedFiles.length > 0) {
          attachments = await handleFileUploads(uid, currentChatId)
          if (attachments === null) {
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
            cleanupOptimisticAttachments(
              optimisticMessage.experimental_attachments
            )
            return
          }
        }

        const options = {
          body: {
            chatId: currentChatId,
            userId: uid,
            model: selectedModel,
            isAuthenticated,
            systemPrompt: preferences.systemPrompt,
            enableSearch,
          },
          experimental_attachments: attachments || undefined,
        }

        handleSubmit(undefined, options)
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        cacheAndAddMessage(optimisticMessage)
        clearDraft()

        if (messages.length > 0) {
          bumpChat(currentChatId)
        }
      } catch {
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        toast({ title: "Failed to send message", status: "error" })
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [
    isImageGenerationMode,
    user,
    input,
    setMessages,
    setInput,
    setIsSubmitting,
    toast,
    // dependencies dari logika chat normal
    files,
    createOptimisticAttachments,
    setFiles,
    checkLimitsAndNotify,
    cleanupOptimisticAttachments,
    ensureChatExists,
    handleFileUploads,
    selectedModel,
    isAuthenticated,
    preferences,
    enableSearch,
    handleSubmit,
    cacheAndAddMessage,
    clearDraft,
    messages.length,
    bumpChat,
  ])

  const handleSuggestion = useCallback(
    async (suggestion: string) => {
      setIsSubmitting(true)
      const optimisticId = `optimistic-${Date.now().toString()}`
      const optimisticMessage = {
        id: optimisticId,
        content: suggestion,
        role: "user" as const,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, optimisticMessage])

      try {
        const uid = await getOrCreateGuestUserId(user)

        if (!uid) {
          setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
          return
        }

        const allowed = await checkLimitsAndNotify(uid)
        if (!allowed) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
          return
        }

        const currentChatId = await ensureChatExists(uid, suggestion)

        if (!currentChatId) {
          setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
          return
        }

        const options = {
          body: {
            chatId: currentChatId,
            userId: uid,
            model: selectedModel,
            isAuthenticated,
            systemPrompt: preferences.systemPrompt,
          },
        }

        append(
          {
            role: "user",
            content: suggestion,
          },
          options
        )
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      } catch {
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        toast({ title: "Failed to send suggestion", status: "error" })
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      ensureChatExists,
      selectedModel,
      user,
      append,
      checkLimitsAndNotify,
      isAuthenticated,
      setMessages,
      setIsSubmitting,
      preferences,
    ]
  )

  const handleReload = useCallback(async () => {
    const uid = await getOrCreateGuestUserId(user)
    if (!uid) {
      return
    }

    const options = {
      body: {
        chatId,
        userId: uid,
        model: selectedModel,
        isAuthenticated,
        systemPrompt: preferences.systemPrompt,
      },
    }

    reload(options)
  }, [user, chatId, selectedModel, isAuthenticated, preferences, reload])

  const { setDraftValue } = useChatDraft(chatId)
  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setDraftValue(value)
    },
    [setInput, setDraftValue]
  )

  return {
    messages,
    input,
    handleSubmit,
    status,
    error,
    reload,
    stop,
    setMessages,
    setInput,
    append,
    isAuthenticated,
    systemPrompt,
    hasSentFirstMessageRef,
    isSubmitting,
    setIsSubmitting,
    hasDialogAuth,
    setHasDialogAuth,
    enableSearch,
    setEnableSearch,
    submit,
    handleSuggestion,
    handleReload,
    handleInputChange,
  }
}