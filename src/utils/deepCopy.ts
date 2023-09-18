export default function deepCopy<T>(obj: T): T {
    if (obj instanceof Array) {
        return obj.map(deepCopy) as T;
    }

    if (obj instanceof Object) {
        let newObj = {};
        Object.keys(obj).forEach((key) => {
            newObj[key] = deepCopy(obj[key]);
        });

        return newObj as T;
    }

    return obj as T;
}
