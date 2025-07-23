import { ChatContainer } from "@/app/components/chat/chat-container"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { CodeBlockFullScreenProvider } from "@/app/context/code-block-fullscreen-context";

export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <CodeBlockFullScreenProvider>
      <MessagesProvider>
        <LayoutApp>
          <ChatContainer />
        </LayoutApp>
      </MessagesProvider>
    </CodeBlockFullScreenProvider>
  )
}