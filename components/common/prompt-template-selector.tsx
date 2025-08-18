"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { promptTemplates, PromptTemplate } from "@/lib/templates/templates"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

type Props = {
  children: React.ReactNode
}

export function PromptTemplateSelector({ children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  // Fix the destructuring here
  const { preferences, setSystemPrompt } = useUserPreferences()
  
  const filteredTemplates = promptTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleSelectTemplate = (template: PromptTemplate) => {
    // Use the new setter function
    setSystemPrompt(template.systemPrompt)
    setIsOpen(false)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select a Prompt Template</DialogTitle>
        </DialogHeader>
        <div className="relative mb-2">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[300px]">
          <div className="flex flex-col gap-2">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className={cn(
                    "cursor-pointer rounded-md p-3 transition-colors hover:bg-accent",
                    // Compare with the preferences from the provider
                    preferences.systemPrompt === template.systemPrompt && "bg-accent"
                  )}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center text-sm">No matching templates found.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}