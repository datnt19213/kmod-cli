"use client";
import React, { useState } from 'react';

export interface ImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  text?: string;
  alt?: string;
  className?: string;
  imageClass?: string; 
  fallbackSrc?: string;
  fit?: "w" | "h" | "both";
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  id?: string;
  onClick?: (event: React.MouseEvent<HTMLImageElement>) => void;
  resourceLoadPriority?: "auto" | "high" | "low";
  loadmode?: "lazy" | "eager";
  sendAccessUrlToImageServer?:
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "strict-origin";
//   crossOrigin?: "anonymous" | "use-credentials";
  fetchPriority?: "auto" | "high" | "low";
}

export const Image: React.FC<ImageProps> = ({
  src,
  text,
  alt = "image",
  className = "",
  imageClass = "", 
  fallbackSrc = "https://picsum.photos/200/300/?blur=8",
  // fallbackSrc = "https://images.pexels.com/photos/349758/hummingbird-bird-birds-349758.jpeg",
  fit = "both",
  style = {},
  containerStyle = {},
  resourceLoadPriority = "auto",
  loadmode = "lazy",
  sendAccessUrlToImageServer = "no-referrer",
//   crossOrigin = "anonymous",
  id,
  onClick,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [loading, setLoading] = useState(true);
  // console.log("Image component rendered with src:", imgSrc);

  return (
    <div
      style={containerStyle}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        id={id}
        style={style}
        src={imgSrc}
        // crossOrigin={crossOrigin}
        loading={loadmode}
        referrerPolicy={sendAccessUrlToImageServer}
        fetchPriority={resourceLoadPriority}
        alt={alt}
        className={`${
          fit === "w"
            ? "w-full h-auto"
            : fit === "h"
            ? "h-full w-auto"
            : "w-full h-full"
        } object-cover transition-all duration-500 ${
          loading ? "opacity-0" : "opacity-100"
        } ${imageClass}`}
        onLoad={() => setLoading(false)}
        onError={(e) => {
          // console.error("Error loading image:", e);
          if (text) {
            setImgSrc(text);
            setLoading(false);
            return;
          }
          setImgSrc(fallbackSrc);
          setLoading(false);
        }}
      />
    </div>
  );
};
