import dayjs from 'dayjs'

export function formatDate(value: string | number | Date, format = 'YYYY-MM-DD HH:mm') {
  return dayjs(value).format(format)
}
