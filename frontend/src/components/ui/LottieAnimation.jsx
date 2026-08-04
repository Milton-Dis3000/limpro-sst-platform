import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function LottieAnimation({ animationPath, loop = true, autoplay = true, className = "", style = {}, ...props }) {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    if (!animationPath) return;

    let canceled = false;

    fetch(animationPath)
      .then((response) => response.json())
      .then((data) => {
        if (!canceled) {
          setAnimationData(data);
        }
      })
      .catch(() => {
        if (!canceled) {
          setAnimationData(null);
        }
      });

    return () => {
      canceled = true;
    };
  }, [animationPath]);

  if (!animationData) {
    return (
      <div className={className} style={{ minHeight: 200, display: "grid", placeItems: "center", ...style }}>
        <span className="text-sm text-[#5A5A5A]">Cargando animación...</span>
      </div>
    );
  }

  return <Lottie animationData={animationData} loop={loop} autoplay={autoplay} className={className} style={style} {...props} />;
}
