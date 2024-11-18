const AUTHORIZATION_RESPONSE_MESSAGE_TYPE = 'authorization_response'
const LOGOUT_RESPONSE_MESSAGE_TYPE = 'logout_response'

interface IDPResponse {
    type: 'authorization_response' | 'logout_response'
    response: { state?: string; iss?: string; code?: string }
    url: string
}

interface NavigateParams {
    url: string;
    /** The request "nonce" parameter. */
    nonce?: string;
    /** The request "state" parameter. For sign out requests, this parameter is optional. */
    state?: string;
    response_mode?: "query" | "fragment";
    scriptOrigin?: string;
}

export class IframeNavigator {
    public iframe: WindowProxy | null = this.createHiddenIframe().contentWindow
    public readonly _disposeHandlers = new Set<() => void>()
    
    constructor(private timeOutInSeconds = 5 * 1000) {

    }
    
    createHiddenIframe() {
        const iframe = window.document.createElement("iframe");

        // shotgun approach
        iframe.style.visibility = "hidden";
        iframe.style.position = "fixed";
        iframe.style.left = "-1000px";
        iframe.style.top = "0";
        iframe.width = "0";
        iframe.height = "0";

        window.document.body.appendChild(iframe);
        return iframe;
    }

    readUrlParams = (url: string = window.location.href) => {
        const parsedUrl = new URL(url, 'http://127.0.0.1')
        const params = parsedUrl.search
        return new URLSearchParams(params.slice(1))
    }

    handleSignin(data: IDPResponse) {
        const urlParams = this.readUrlParams(data.url)

        // handle response from IDP
        if(data.response) {
            const url = new URLSearchParams({
                ...data.response,
                session_state: data.response?.code ? 'active' : '',
            })
            return `?${url.toString()}`
        }

        // handle response from oidc-client
        if (urlParams.get('code')) {
            urlParams.append('session_state', 'active')
            return `?${urlParams.toString()}`
        }
        return ''
    }

    getResponseFromIframe = async (params: NavigateParams) => {
        const promise = new Promise((resolve, reject) => {

            const timer = setTimeout(() => {
                reject(new Error('IFrame timed out without a response'))
            }, this.timeOutInSeconds * 1000)
            this._disposeHandlers.add(() => clearTimeout(timer))

            const listener = (e: MessageEvent) => {
                const data: IDPResponse = e.data
                const allowedResponseTypes = [LOGOUT_RESPONSE_MESSAGE_TYPE, AUTHORIZATION_RESPONSE_MESSAGE_TYPE]
                if (!allowedResponseTypes.includes(data.type)) {
                    // silently discard events not intended for us
                    return
                }

                if(data.type == LOGOUT_RESPONSE_MESSAGE_TYPE) {
                    return resolve({
                        url: new URL('', 'http://127.0.0.1').href,
                    })
                }

                const urlParams = this.readUrlParams(data.url)

                const state = data.response?.state || urlParams.get('state')

                if (!state || state !== params.state) {
                    this._dispose()
                    reject(new Error('Invalid response from window'))
                }
                const url = this.handleSignin(data)

                resolve({
                    url,
                })
            }

            window.addEventListener('message', listener, false)

            this._disposeHandlers.add(() =>
                window.removeEventListener('message', listener, false)
            )
        })
        return promise
    }
    
    async navigate (params: NavigateParams) {
        this.iframe?.location.replace(params.url);
        const result = await this.getResponseFromIframe(params)

        // dispose event handlers
        this._dispose()

        // close iframe
        this.close()

        return result
    }

    private _dispose(): void {
        for (const dispose of this._disposeHandlers) {
            dispose()
        }
        this._disposeHandlers.clear()
    }

    close() {
        this.iframe?.location.replace('about:blank')
    }
}