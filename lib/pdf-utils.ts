export function exportJobTitleToPDF(jobTitleId: string) {
  // Create iframe
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'

  // Add to document
  document.body.appendChild(iframe)

  // Load print page
  iframe.src = `/admin/job-titles/${jobTitleId}/print`

  // Wait for load and trigger print
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()

        // Remove iframe after print dialog closes (or after 1 second)
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      } catch (error) {
        console.error('Error printing:', error)
        document.body.removeChild(iframe)
      }
    }, 500)
  }

  // Fallback: remove iframe if load fails
  iframe.onerror = () => {
    document.body.removeChild(iframe)
    // Fallback to opening in new tab
    window.open(`/admin/job-titles/${jobTitleId}/print?autoprint=true`, '_blank')
  }
}
