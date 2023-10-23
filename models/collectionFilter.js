import { log } from '../log.js';
import Model from './model.js';

export default class CollectionFilter extends Model {
    constructor(objectsList, params, model) {
        super();
        this.objectsList = objectsList ? objectsList : [];
        this.fields = [];

        for (const field of model.fields) {
            this.fields.push(field.name);
        }

        this.params = params;
    }

    get() {
        const PARAMS = this.params;
        let paramsKeys = null;

        try {
            paramsKeys = Object.keys(PARAMS);
        }
        catch {
            return this.objectsList;
        }

        let filterLst = CollectionFilter.copyLst(this.objectsList);

        for (const KEY of paramsKeys) {
            const LAST_POS = PARAMS[KEY].lastIndexOf(",");
            const IS_Multiple = LAST_POS > -1;
            const VALUE = IS_Multiple ? PARAMS[KEY].substring(0, LAST_POS) : PARAMS[KEY];
            
            switch (KEY.toLowerCase()) {
                case "sort":
                        filterLst = CollectionFilter.sortObjects(VALUE, filterLst, PARAMS[KEY].includes("desc"));
                        log(filterLst);
                    break;
                
                case "offset":
                        if (paramsKeys.includes("limit")) {
        
                            const LIMIT = Number.parseInt(PARAMS["limit"]);
                            const OFFSET = Number.parseInt(PARAMS["offset"]);

                            filterLst = filterLst.slice(LIMIT * OFFSET, LIMIT * OFFSET + LIMIT);
                        }
                    break;

                case "fields":
                    let value = PARAMS[KEY];

                    if (IS_Multiple)
                    {
                        value = PARAMS[KEY].split(",");
                        let isValid = true;

                        for (let index = 0; index < value.length; index++) {
                            
                            let val = value[index];
                            value[index] = val.replace(val, val.trim());
                            isValid = CollectionFilter.isAny(this.fields, value[index])

                            if(!isValid)
                                return [];
                        }

                        const LST_COPY = [];

                        for (const item of filterLst) {
                            let copy = {};
                            
                            for (let val of value) {
                                copy[val] = item[val];
                            }

                            LST_COPY.push(copy);
                            filterLst = filterLst.filter(e => !Object.is(e, copy));
                        }

                        filterLst = LST_COPY;
                    }
                    else if (CollectionFilter.isAny(this.fields, value.trim())) {
                        value = value.trim();
                        const LST_COPY = [];

                        for (const item of filterLst) {
                            let copy = {};
                            copy[value] = item[value];
                            
                            LST_COPY.push(copy);
                            filterLst.filter(e => e[value] !== copy[value]);
                        }

                        filterLst = LST_COPY;
                    }
                    break;
                
                default:
                    if (KEY != "limit")
                        filterLst = CollectionFilter.select(filterLst, KEY, VALUE);
                break;
            }
        }

        return filterLst;
    }

    static isAny(lst, search) {
        let isValid = false;

        for (const item of lst) {
            isValid = CollectionFilter.valueMatch(item, search);

            if (isValid)
                break;
        }

        return isValid;
    }

    static copyLst(lst) {
        const copy = [];
        for (const iTEM of lst) {
            copy.push(iTEM);
        }

        return copy;
    }

    static getRealKeys(lstObjects) {
        const KEYS = [];
        const FIELDS = Object.values(lstObjects);
        for (const VALUE of FIELDS) {
            KEYS.push(VALUE["name"]);
        }
        return KEYS;
    }

    static sortObjects(key, objectsList, isDesc) {
        return objectsList.sort((e, r) => isDesc ? -CollectionFilter.compareNum(e[key], r[key])
         : CollectionFilter.compareNum(e[key], r[key]));
    }

    static compareNum(x, y) {
        if (x === y) return 0;
        else if (x < y) return -1;
        return 1;
    }

    static innerCompare(x, y) {
        if ((typeof x) === 'string')
        return x.localeCompare(y);
        else
        return CollectionFilter.compareNum(x, y);
    }

    static valueMatch(value, searchValue) {
        try {
        let exp = '^' + searchValue.toLowerCase().replace(/\*/g, '.*') + '$';
        return new RegExp(exp).test(value.toString().toLowerCase());
        } catch (error) {
        console.log(error);
        return false;
        }
    }
        
        

    static select(objectsList, key, value) {
        return objectsList.filter((e) => CollectionFilter.valueMatch(e[key], value));
    }
}