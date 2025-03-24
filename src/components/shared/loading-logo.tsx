import type { CSSProperties } from "react"
import Image from "next/image"

interface LoadingLogoProps {
  loading: boolean
  size?: number
}

export const LoadingLogo = ({ loading, size = 300 }: LoadingLogoProps) => {
  const style: CSSProperties = {
    animation: loading ? 'spin 3s linear infinite' : 'none',
  };
  
  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div style={style} className="transition-all duration-500">
        <Image
          src="/escrow-background.png"
          alt="Trustless Work"
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/80 rounded-full p-3">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"/>
          </div>
        </div>
      )}
    </div>
  )
}
