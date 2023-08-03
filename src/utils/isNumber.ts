

export const isNumber = ( val: any ) => {
  var n = Number(JSON.stringify(val))

  return val !== null && val !== false && !Number.isNaN(n)
}

export default isNumber