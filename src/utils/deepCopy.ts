export default function deepCopy(obj: unknown): unknown {
    if (obj instanceof Array) {
        return obj.map(deepCopy);
    }

    if (obj instanceof Object) {
        let newObj = {};
        Object.keys(obj).forEach((key) => {
            newObj[key] = deepCopy(obj[key]);
        });

        return newObj;
    }

    return obj;
}
