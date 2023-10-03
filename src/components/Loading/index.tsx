import { useTheme } from '@mui/styles'
import React from 'react'

const rects = [
  {
    x:"19",
    y:"19",
    begin:"0s",
  },
  {
    x:"40",
    y:"19",
    begin:"0.125s",
  },
  {
    x:"61",
    y:"19",
    begin:"0.25s",
  },
  {
    x:"19",
    y:"40",
    begin:"0.875s",
  },
  {
    x:"61",
    y:"40",
    begin:"0.375s",
  },
  {
    x:"19",
    y:"61",
    begin:"0.75s",
  },
  {
    x:"40",
    y:"61",
    begin:"0.625s",
  },
  {
    x:"61",
    y:"61",
    begin:"0.5s",
  },
]

const AnimatedRect = ({ x, y, begin }) => {
  const transparent= 'rgba(0,0,0,0)'
  const main= '#82368c'

  return <rect x={x} y={y} width="20" height="20" fill="#82368c">
  <animate attributeName="fill" values={`${transparent};${main};${main}`} keyTimes="0;0.125;1" dur="1s" repeatCount="indefinite" begin={begin} calcMode="discrete"/>
</rect>
}

export default function Loading({ style }) {
  

  return (
    <svg style={{
      margin: 'auto',
      background: 'none',
      display: 'block',
      shapeRendering: 'auto',
      ...style 
    }}
    width="200px"
    height="200px"
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid"
    >
      <>
      {rects.map((props, index) => <AnimatedRect {...props} key={index} />)}
      </>
    </svg>
  )
}
