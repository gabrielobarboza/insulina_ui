

const isNumber = ( val: any ) => {
  var n = Number(JSON.stringify(val))

  return val !== null && val !== false && n !== NaN
}

export default isNumber