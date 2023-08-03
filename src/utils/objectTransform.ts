

type Predicate<T> = (key: keyof T) => boolean

function transform<T>(obj: T, predicate: Predicate<T> ): Partial<T> {
  return Object.keys(obj).reduce((memo, key) => {
    if(predicate(key as keyof T)) {
        memo[key] = obj[key]
    }
    return memo
  }, {})
}

export function objOmit<T>(obj: T, items: (keyof T)[]): Partial<T> {
  return transform(obj, key => !items.includes(key))
}

export function objPick<T>(obj: T, items: (keyof T)[]): Partial<T> {
  return transform(obj, key => items.includes(key))
}
