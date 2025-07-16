import * as React from "react"
import { SVGProps } from "react"
const SVGComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fillRule='evenodd'
    clipRule='evenodd'
    shapeRendering='geometricPrecision'
    textRendering='geometricPrecision'
    viewBox='0 0 256 256'
    xmlnsXlink='http://www.w3.org/1999/xlink'
    {...props}
  >
    <path
      fill='#2158ee'
      d='M184.5 112.5q-20.236 31.629-58 34-36.896.301-59-29-24.948-41.82 2.5-82Q107.8-5.36 158.5 18q45.173 29.655 31.5 82.5a98 98 0 0 1-5.5 12'
      opacity={0.998}
    />
    <path
      fill='#01b400'
      d='M184.5 112.5q59.025 3.875 69.5 62 2.415 48.435-40.5 70.5-48.709 17.697-83-20.5-6.413-10.328-10.5-22-9.04-29.465 6.5-56 37.764-2.371 58-34'
      opacity={0.995}
    />
    <path
      fill='#fe1100'
      d='M67.5 117.5q22.104 29.301 59 29-15.54 26.535-6.5 56 4.087 11.672 10.5 22-20.866 28.362-56 31h-5q-60.48-7.985-66-69 4.022-60.519 64-69'
      opacity={0.996}
    />
  </svg>
)
export default SVGComponent
