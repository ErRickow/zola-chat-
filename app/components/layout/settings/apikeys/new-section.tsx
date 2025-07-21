"use client"

export function NewSection() {
  return (
    <div>
      <p className="text-muted-foreground text-sm">
        To use the Neosantara AI API in your application, please refer to our{" "}
        <a
          href="https://docs.neosantara.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          documentation
        </a>
        .
      </p>
    </div>
  )
}