/* eslint-disable @next/next/no-before-interactive-script-outside-document */

import Script from "next/script"
import { fetchTrackingSettings } from "@/lib/tracking"

export async function TrackingScriptsHead() {
  const cfg = await fetchTrackingSettings()
  if (!cfg.headSnippet?.trim()) return null

  return (
    <Script
      id="tracking-head"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: cfg.headSnippet }}
    />
  )
}

export async function TrackingScriptsBodyStart() {
  const cfg = await fetchTrackingSettings()
  if (!cfg.bodyStartSnippet?.trim()) return null

  return (
    <div
      data-slot="tracking-body-start"
      dangerouslySetInnerHTML={{ __html: cfg.bodyStartSnippet }}
    />
  )
}

export async function TrackingScriptsBodyEnd() {
  const cfg = await fetchTrackingSettings()
  if (!cfg.bodyEndSnippet?.trim()) return null

  return (
    <div
      data-slot="tracking-body-end"
      dangerouslySetInnerHTML={{ __html: cfg.bodyEndSnippet }}
    />
  )
}
