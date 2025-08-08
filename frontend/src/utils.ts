
export function formatTime(iso: string) {
    return new Date(iso).toLocaleString('sr-RS', {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    })
}