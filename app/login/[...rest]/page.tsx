import { redirect } from "next/navigation"

type SearchParams = { [key: string]: string | string[] | undefined }

export default function LoginCatchAll({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v))
    } else if (value) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  redirect(`/login${query ? `?${query}` : ""}`)
}
