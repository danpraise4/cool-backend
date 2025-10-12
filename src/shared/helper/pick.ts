import { ParsedQs } from 'qs';
/**
 * Create an object composed of the picked object properties
 * @param {Object} object
 * @param {string[]} keys
 * @returns {Object}
 */
type ObjT = {
  [key: string]: string;
};

const pick = (object: ObjT | ParsedQs, keys: string[]): object => {
  return keys.reduce((obj: ObjT, key: keyof ObjT) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key] as string;
    }
    return obj;
  }, {});
};

export default pick;