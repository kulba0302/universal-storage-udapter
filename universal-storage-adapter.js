const storageAdapter = (() => {
    const checkWhatKindOfStorageIsAvailable = () => {
        if (window.localStorage) return 'localStorage';
        if (document.cookie) return 'cookie';
        return 'sessionStorage';
    };

    const checkIfWindowExists = () => (typeof (window) === 'undefined');

    const checkExpirationTime = ({ key, storageType }) => {
        const storageData = window[storageType].getItem(key);
        if (storageData) {
            const formatedDate = JSON.parse(storageData).expires;

            if (new Date(formatedDate).getTime() <= new Date().getTime()) {
                window[storageType].removeItem(key);
            }
        }
    };

    const remove = ({ key }) => {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
    };

    const calculateExpirationTime = (expiresSeconds) => {
        const date = new Date();
        const millisecondsValue = 1000;
        date.setTime(date.getTime() + (expiresSeconds * millisecondsValue));
        return date.toUTCString();
    };


    const getFromCookie = ({ key }) => {
        const name = `${key}=`;
        const allCookies = document.cookie.split(';');
        for (let i = 0; i < allCookies.length; i++) {
            let cookie = allCookies[i];

            while (cookie.charAt(0) == ' ') {
                cookie = cookie.substring(1);
            }

            if (cookie.indexOf(name) == 0) {
                return {
                    key,
                    data: JSON.parse(cookie.substring(name.length, cookie.length)),
                    storageType: 'cookie'
                };
            }
        }
        return '';
    };

    const getFromStorage = ({ key, storageType }) => {
        try {
            const storageData = window[storageType].getItem(key);
            if (storageData) {
                return {
                    key,
                    data: JSON.parse(storageData),
                    storageType
                };
            }
            return {
                key,
                data: false,
                storageType
            };
        } catch (e) {
            return {
                key,
                data: false,
                storageType,
                error: e
            };
        }
    };

    const setToCookie = ({ key, data }) => {
        const expires = `expires=${data.expires}`;
        document.cookie = `${key}=${JSON.stringify(data.value)};${expires};path=/`;
        return {
            key
        };
    };

    const setToStorage = ({ key, data, storageType }) => {
        try {
            window[storageType].setItem(key, JSON.stringify(data));
            return {
                key,
                storageType,
                error: false
            };
        } catch (e) {
            return {
                key,
                storageType,
                error: e
            };
        }
    };

    const storageActionHandler = ({
        isSetAction = false, key = false, data = false, storageType = false
    }) => {
        if (checkIfWindowExists()) return false;
        storageType = storageType || checkWhatKindOfStorageIsAvailable();

        if (storageType !== 'cookie') checkExpirationTime({ key, storageType });

        if (data) {
            data = {
                value: data.value,
                expires: calculateExpirationTime(data.expires)
            };
        }

        if (storageType === 'cookie') return isSetAction ? setToCookie({ key, data }) : getFromCookie({ key });
        return isSetAction ? setToStorage({ key, data, storageType }) : getFromStorage({ key, storageType });
    };

    return {
        get: ({ key, storageType }) => storageActionHandler({ key, storageType }),
        set: ({ key, data, storageType }) => storageActionHandler({
            isSetAction: true, key, data, storageType
        }),
        remove: ({ key }) => remove({ key })
    };
})();

export default storageAdapter;
