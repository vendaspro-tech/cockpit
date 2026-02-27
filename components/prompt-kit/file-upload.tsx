"use client"

import { Slot } from "@radix-ui/react-slot"
import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ChangeEvent,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode,
} from "react"

import { cn } from "@/lib/utils"

type FileUploadContextValue = {
  dragging: boolean
  accept?: string
  openPicker: () => void
}

const FileUploadContext = createContext<FileUploadContextValue | null>(null)

function useFileUploadContext() {
  const context = useContext(FileUploadContext)
  if (!context) {
    throw new Error("FileUpload components must be used within FileUpload")
  }
  return context
}

type FileUploadProps = {
  children: ReactNode
  onFilesAdded: (files: File[]) => void
  accept?: string
  multiple?: boolean
  className?: string
}

export function FileUpload({
  children,
  onFilesAdded,
  accept,
  multiple = true,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputId = useId()

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    onFilesAdded(Array.from(files))
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files)
    event.target.value = ""
  }

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragging(true)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = "copy"
    setDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const related = event.relatedTarget as Node | null
    if (related && event.currentTarget.contains(related)) {
      return
    }

    setDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  return (
    <FileUploadContext.Provider
      value={{
        dragging,
        accept,
        openPicker: () => inputRef.current?.click(),
      }}
    >
      <div
        className={cn("relative", className)}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
        />
        {children}
      </div>
    </FileUploadContext.Provider>
  )
}

type FileUploadTriggerProps = ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean
}

export function FileUploadTrigger({ asChild = false, ...props }: FileUploadTriggerProps) {
  const context = useFileUploadContext()
  const Component = asChild ? Slot : "button"

  const triggerProps: ComponentPropsWithoutRef<"button"> = {
    ...props,
    onClick: (event) => {
      props.onClick?.(event)
      context.openPicker()
    },
  }

  if (!asChild) {
    triggerProps.type = "button"
  }

  return <Component {...triggerProps} />
}

export function FileUploadContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const context = useFileUploadContext()
  if (!context.dragging) return null

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 rounded-2xl border-2 border-dashed border-primary/50 bg-background/70",
        className
      )}
      {...props}
    />
  )
}
