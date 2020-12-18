import { useEffect } from 'react';
import throttle from 'lodash.throttle';

function useScrollWatcher(ref, cb, throttlingTimeout = 0) {
  useEffect(() => {
    if (!cb) {
      return;
    }
    const scrollingElement = ref.current;
    const onScroll = throttle(() => {
      cb(scrollingElement.scrollTop);
    }, throttlingTimeout);

    scrollingElement.addEventListener('scroll', onScroll);

    return () => {
      scrollingElement.removeEventListener('scroll', onScroll);
      cb(0);
    };
  }, [ref, cb, throttlingTimeout]);
}

export default useScrollWatcher;
