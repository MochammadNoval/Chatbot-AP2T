import { onMounted, onUnmounted } from "vue";

  export function useIdleTimeOut (timeout = 2 * 60 * 1000, onIdle){
    let timer = null;

    const resetTimer = () =>  {
        clearTimeout(timer);
        timer = setTimeout(() => {
            onIdle();
        }, timeout);
    }

    const events  = ["mousemove","mousedown","keypress","scroll","touchstart"];

    const addEvents = () => {
        events.forEach(event => {
            window.addEventListener(event, resetTimer)
        });
    };

    const removeEvents = () => {
        events.forEach(event => {
            window.removeEventListener(event, resetTimer)
        });
    };

    onMounted(()=> {
        resetTimer();
        addEvents();
    })

    onUnmounted(()=> {
        clearTimeout(timer);
        removeEvents();
    })
}