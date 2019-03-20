/**
 */

/**
 * @param {*} time string potentially with khmer numbers
 */
const numberMap = {
  '១': 1,
  '២': 2,
  '៣': 3,
  '៤': 4,
  '៥': 5,
  '៦': 6,
  '៧': 7,
  '៨': 8,
  '៩': 9,
  '០': 0
}

// quick and dirty solution, though probably not as fast as char codes or whatever
const convertToArabicNumbers = (num) => {
  let str = num
  if (typeof str !== 'string') {
    str = String(str)
  }
  const keys = Object.keys(numberMap)
  for (var i = 0; i < keys.length; i ++) {
    let key = keys[i]
    str = str.replace(new RegExp(key, "g"), numberMap[key])
  }


  return str
};

export { convertToArabicNumbers };
