"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, ReactNode, useContext, useState } from "react"
import {
  convertFromApiFormat,
  convertToApiFormat,
  defaultPreferences,
  type LayoutType,
  type UserPreferences,
} from "./utils"

export {
  type LayoutType,
  type UserPreferences,
  convertFromApiFormat,
  convertToApiFormat,
}

const PREFERENCES_STORAGE_KEY = "user-preferences"
const LAYOUT_STORAGE_KEY = "preferred-layout"

interface UserPreferencesContextType {
  preferences: UserPreferences
  setLayout: (layout: LayoutType) => void
  setPromptSuggestions: (enabled: boolean) => void
  setShowToolInvocations: (enabled: boolean) => void
  setShowConversationPreviews: (enabled: boolean) => void
  setMultiModelEnabled: (enabled: boolean) => void
  setSystemPrompt: (prompt: string) => void
  toggleModelVisibility: (modelId: string) => void
  isModelHidden: (modelId: string) => boolean
  isLoading: boolean
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined)

async function fetchUserPreferences(): Promise<UserPreferences> {
  const response = await fetch("/api/user-preferences")
  if (!response.ok) {
    throw new Error("Failed to fetch user preferences")
  }
  const data = await response.json()
  return convertFromApiFormat(data)
}

async function updateUserPreferences(
  update: Partial<UserPreferences>
): Promise<UserPreferences> {
  const response = await fetch("/api/user-preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(convertToApiFormat(update)),
  })

  if (!response.ok) {
    throw new Error("Failed to update user preferences")
  }

  const data = await response.json()
  return convertFromApiFormat(data)
}

function getLocalStoragePreferences(): UserPreferences {
  if (typeof window === "undefined") return defaultPreferences

  const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // fallback to legacy layout storage if JSON parsing fails
    }
  }

  const layout = localStorage.getItem(LAYOUT_STORAGE_KEY) as LayoutType | null
  return {
    ...defaultPreferences,
    ...(layout ? { layout } : {}),
  }
}

function saveToLocalStorage(preferences: UserPreferences) {
  if (typeof window === "undefined") return

  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  localStorage.setItem(LAYOUT_STORAGE_KEY, preferences.layout)
}

export function UserPreferencesProvider({
  children,
  userId,
  initialPreferences,
}: {
  children: ReactNode
  userId?: string
  initialPreferences?: UserPreferences
}) {
  const isAuthenticated = !!userId
  const queryClient = useQueryClient()

  const getInitialData = (): UserPreferences => {
    if (initialPreferences && isAuthenticated) {
      return initialPreferences
    }

    if (!isAuthenticated) {
      return getLocalStoragePreferences()
    }

    return defaultPreferences
  }

  // Gunakan useState untuk mengelola state lokal
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    getInitialData()
  )

  // Gunakan useQuery untuk sinkronisasi awal
  const { isLoading } = useQuery<UserPreferences>({
    queryKey: ["user-preferences", userId],
    queryFn: async () => {
      if (!isAuthenticated) {
        return getLocalStoragePreferences()
      }

      try {
        const data = await fetchUserPreferences()
        setPreferences(data) // Perbarui state lokal dengan data dari server
        return data
      } catch (error) {
        console.error(
          "Failed to fetch user preferences, falling back to localStorage:",
          error
        )
        const localStorageData = getLocalStoragePreferences()
        setPreferences(localStorageData)
        return localStorageData
      }
    },
    enabled: typeof window !== "undefined",
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount) => {
      return isAuthenticated && failureCount < 2
    },
    initialData:
      initialPreferences && isAuthenticated ? getInitialData() : undefined,
  })

  // Mutation untuk memperbarui preferensi
  const mutation = useMutation({
    mutationFn: updateUserPreferences,
    onMutate: async (update) => {
      const updated = { ...preferences, ...update }
      setPreferences(updated) // Perbarui state lokal secara optimis
      if (!isAuthenticated) {
        saveToLocalStorage(updated)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-preferences", userId], data)
      setPreferences(data) // Perbarui state lokal dengan data dari server
    },
    onError: (_err, _update) => {
      // Tangani error, bisa dengan memutar kembali state lokal
      const previous = queryClient.getQueryData<UserPreferences>([
        "user-preferences",
        userId,
      ])
      if (previous) {
        setPreferences(previous)
        if (!isAuthenticated) {
          saveToLocalStorage(previous)
        }
      }
      toast({
        title: "Failed to update preferences",
        status: "error",
      })
    },
  })

  const updatePreferences = (update: Partial<UserPreferences>) => {
    if (isAuthenticated) {
      mutation.mutate(update)
    } else {
      setPreferences((prev) => {
        const updated = { ...prev, ...update }
        saveToLocalStorage(updated)
        return updated
      })
    }
  }

  const setLayout = (layout: LayoutType) => {
    updatePreferences({ layout })
  }

  const setPromptSuggestions = (enabled: boolean) => {
    updatePreferences({ promptSuggestions: enabled })
  }

  const setShowToolInvocations = (enabled: boolean) => {
    updatePreferences({ showToolInvocations: enabled })
  }

  const setShowConversationPreviews = (enabled: boolean) => {
    updatePreferences({ showConversationPreviews: enabled })
  }

  const setMultiModelEnabled = (enabled: boolean) => {
    updatePreferences({ multiModelEnabled: enabled })
  }

  const setSystemPrompt = (prompt: string) => {
    updatePreferences({ systemPrompt: prompt })
  }

  const toggleModelVisibility = (modelId: string) => {
    const currentHidden = preferences.hiddenModels || []
    const isHidden = currentHidden.includes(modelId)
    const newHidden = isHidden
      ? currentHidden.filter((id) => id !== modelId)
      : [...currentHidden, modelId]
    updatePreferences({ hiddenModels: newHidden })
  }

  const isModelHidden = (modelId: string) => {
    return (preferences.hiddenModels || []).includes(modelId)
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        setLayout,
        setPromptSuggestions,
        setShowToolInvocations,
        setShowConversationPreviews,
        setMultiModelEnabled,
        setSystemPrompt,
        toggleModelVisibility,
        isModelHidden,
        isLoading,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    throw new Error(
      "useUserPreferences must be used within UserPreferencesProvider"
    )
  }
  return context
}