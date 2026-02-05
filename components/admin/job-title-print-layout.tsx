'use client'

import { ReactNode } from "react"

interface JobTitlePrintLayoutProps {
  children: ReactNode
}

export function JobTitlePrintLayout({ children }: JobTitlePrintLayoutProps) {
  return (
    <>
      <style jsx global>{`
        @media print {
          /* Force white background */
          html,
          body,
          * {
            background: white !important;
            background-color: white !important;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          @page {
            margin: 1.5cm;
            size: A4;
            background: white;
          }

          .print\\:hidden {
            display: none !important;
          }

          .page-break-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Hide navigation elements */
          nav,
          aside,
          header[role="banner"],
          [role="navigation"],
          .sidebar,
          [data-sidebar],
          [data-slot="sidebar"],
          button,
          a[href]:not(.no-print) {
            display: none !important;
          }

          /* Show main content full width */
          main,
          [role="main"] {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Remove ALL borders */
          *,
          *::before,
          *::after {
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
          }

          /* Add only subtle dividers where needed */
          header {
            border-bottom: 2px solid #000 !important;
          }

          /* Light gray backgrounds for cards */
          .bg-gray-50,
          .bg-muted {
            background: #f9fafb !important;
            background-color: #f9fafb !important;
          }
        }
      `}</style>
      {children}
    </>
  )
}
