import { useEffect, useRef } from "react";

export const useHeightTransition = ({
  updateOnChangeKey,
  ref,
  duration = 400,
}) => {
  const prevHeight = useRef("");
  const timeoutId = useRef(null);

  const heightTransitionWrapperFn = (func) => (args) => {
    prevHeight.current = ref?.current?.offsetHeight || "";
    func(args);
  };

  const updatePrevHeight = () =>
    (prevHeight.current = ref?.current?.offsetHeight || "");

  useEffect(() => {
    clearTimeout(timeoutId.current);
    if (ref?.current && ref.current.offsetHeight && prevHeight.current) {
      const elem = ref.current;
      const newHeight = elem.offsetHeight;
      elem.style.height = `${prevHeight.current}px`;

      requestAnimationFrame(() => {
        elem.style.transition = `height ${duration}ms ease, opacity ${duration}ms ease`;
        elem.style.height = `${newHeight}px`;
        timeoutId.current = setTimeout(() => {
          timeoutId.current = null;
          elem.style.transition = "";
          elem.style.height = "";
          prevHeight.current = "";
        }, duration);
      });
    }
  }, [updateOnChangeKey, ref, duration]);

  return { heightTransitionWrapperFn, updatePrevHeight };
};
