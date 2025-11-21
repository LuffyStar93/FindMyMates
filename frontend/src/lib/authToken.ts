let accessToken: string | null = null
export const setAccessToken = (t: string | null) => (accessToken = t)
export const getAccessToken = () => accessToken
