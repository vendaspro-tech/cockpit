'use client'

import { EditorRoot, EditorContent, JSONContent, EditorBubble, EditorBubbleItem, EditorCommand, EditorCommandItem, EditorCommandEmpty, EditorCommandList, Command, handleCommandNavigation, StarterKit } from 'novel'
import { useMemo } from 'react'
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote } from 'lucide-react'

interface NovelEditorProps {
  content: any | null
  onChange: (content: string) => void
  editable?: boolean
}

export function NovelEditor({ content, onChange, editable = true }: NovelEditorProps) {
  const extensions = useMemo(
    () =>
      [
        StarterKit,
        Command,
      ] as any[],
    [],
  )

  const initialContent = useMemo(() => {
    if (!content) return undefined

    if (typeof content === 'string') {
      const trimmed = content.trim()
      if (!trimmed) return undefined

      try {
        return JSON.parse(trimmed) as JSONContent
      } catch (e) {
        // When content is stored as HTML, pass it directly to TipTap/Novel.
        return trimmed as any
      }
    }

    return content as JSONContent
  }, [content])

  const suggestionItems = [
    {
      title: "Texto",
      description: "Comece a escrever com texto simples.",
      searchTerms: ["p", "paragraph"],
      icon: <span className="text-lg">T</span>,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run()
      },
    },
    {
      title: "Título 1",
      description: "Título de seção grande.",
      searchTerms: ["h1", "heading1", "title"],
      icon: <Heading1 size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run()
      },
    },
    {
      title: "Título 2",
      description: "Título de seção médio.",
      searchTerms: ["h2", "heading2", "subtitle"],
      icon: <Heading2 size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run()
      },
    },
    {
      title: "Título 3",
      description: "Título de seção pequeno.",
      searchTerms: ["h3", "heading3", "subtitle"],
      icon: <Heading3 size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run()
      },
    },
    {
      title: "Lista com marcadores",
      description: "Crie uma lista simples.",
      searchTerms: ["ul", "list"],
      icon: <List size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: "Lista numerada",
      description: "Crie uma lista com números.",
      searchTerms: ["ol", "ordered"],
      icon: <ListOrdered size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: "Citação",
      description: "Capture uma citação.",
      searchTerms: ["blockquote", "quote"],
      icon: <Quote size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
      },
    },
  ]

  return (
    <div className="relative w-full max-w-screen-lg min-h-[500px]">
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={extensions}
          className="min-h-[500px] bg-background"
          onUpdate={({ editor }) => {
             if (editor) {
               onChange(editor.getHTML())
             }
          }}
          editorProps={{
            handleKeyDown: (view, event) => handleCommandNavigation(event),
            attributes: {
              class: `prose prose-stone dark:prose-invert prose-lg max-w-none focus:outline-none min-h-[500px] py-4 ${!editable ? 'pointer-events-none' : ''}`,
            },
          }}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  onCommand={(val) => item.command(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <EditorBubble
            tippyOptions={{
              placement: "top",
            }}
            className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
          >
            <EditorBubbleItem
              onSelect={(editor) => {
                editor.chain().focus().toggleBold().run()
              }}
            >
              <button className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground">
                <Bold size={16} />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem
              onSelect={(editor) => {
                editor.chain().focus().toggleItalic().run()
              }}
            >
              <button className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground">
                <Italic size={16} />
              </button>
            </EditorBubbleItem>
             <EditorBubbleItem
              onSelect={(editor) => {
                editor.chain().focus().toggleStrike().run()
              }}
            >
              <button className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground">
                <span className="line-through text-xs font-bold">S</span>
              </button>
            </EditorBubbleItem>
          </EditorBubble>
        </EditorContent>
      </EditorRoot>
    </div>
  )
}
