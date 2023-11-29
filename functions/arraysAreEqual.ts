export const arraysAreEqual = (array1: Array<any>, array2: Array<any>) => {
  if (array1.length !== array2.length) {
    return false;
  }

  for (let i = 0; i < array1.length; i++) {
    const obj1 = array1[i];
    const obj2 = array2[i];

    // Compare properties of obj1 and obj2
    for (const key in obj1) {
      if (obj1.hasOwnProperty(key)) {
        if (obj1[key] !== obj2[key]) {
          return false;
        }
      }
    }
  }

  return true;
}
