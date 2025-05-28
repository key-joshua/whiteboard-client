"use client"

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react"

const DrawingCanvas = forwardRef(({ socket, tool, initialDrawingData, onCursorMove }, ref) => {
  const canvasRef = useRef(null)
  const isDrawingRef = useRef(false)
  const currentStrokeRef = useRef(null)

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current

    const redrawCanvas = () => {
      const ctx = canvas.getContext("2d")
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (initialDrawingData) {
        initialDrawingData.forEach((stroke) => {
          drawStroke(stroke, true)
        })
      }
    }

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight

      // Redraw existing strokes after resize
      redrawCanvas()
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [initialDrawingData])

  useEffect(() => {
    if (initialDrawingData && initialDrawingData.length > 0) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      initialDrawingData.forEach((stroke) => {
        drawStroke(stroke, true)
      })
    }
  }, [initialDrawingData])

  useEffect(() => {
    if (!socket) return

    const handleDrawStart = (data) => {
      drawStroke(data.stroke, false)
    }

    const handleDrawMove = (data) => {
      if (data.stroke && data.stroke.points.length > 0) {
        drawStroke(data.stroke, false)
      }
    }

    const handleDrawEnd = (data) => {
      drawStroke(data.stroke, true)
    }

    socket.on("draw-start", handleDrawStart)
    socket.on("draw-move", handleDrawMove)
    socket.on("draw-end", handleDrawEnd)

    return () => {
      socket.off("draw-start", handleDrawStart)
      socket.off("draw-move", handleDrawMove)
      socket.off("draw-end", handleDrawEnd)
    }
  }, [socket])

  const drawStroke = (stroke, isComplete) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!stroke || !stroke.points || stroke.points.length === 0) return

    ctx.strokeStyle = stroke.color || "#000000"
    ctx.lineWidth = stroke.width || 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.beginPath()

    if (stroke.points.length === 1) {
      // Single point (dot)
      const point = stroke.points[0]
      ctx.arc(point.x, point.y, stroke.width / 2, 0, 2 * Math.PI)
      ctx.fill()
    } else {
      // Multiple points (line)
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    }
  }

  const getMousePos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const getTouchPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    }
  }

  const startDrawing = (pos) => {
    isDrawingRef.current = true

    currentStrokeRef.current = {
      id: Date.now() + Math.random(),
      points: [pos],
      color: tool.color,
      width: tool.width,
      timestamp: new Date(),
    }

    if (socket) {
      socket.emit("draw-start", { stroke: currentStrokeRef.current })
    }

    drawStroke(currentStrokeRef.current, false)
  }

  const continueDrawing = (pos) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return

    currentStrokeRef.current.points.push(pos)

    if (socket) {
      socket.emit("draw-move", { stroke: currentStrokeRef.current })
    }

    drawStroke(currentStrokeRef.current, false)
  }

  const stopDrawing = () => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return

    isDrawingRef.current = false

    if (socket) {
      socket.emit("draw-end", { stroke: currentStrokeRef.current })
    }

    currentStrokeRef.current = null
  }

  // Mouse events
  const handleMouseDown = (e) => {
    const pos = getMousePos(e)
    startDrawing(pos)
  }

  const handleMouseMove = (e) => {
    const pos = getMousePos(e)
    onCursorMove(pos.x, pos.y)

    if (isDrawingRef.current) {
      continueDrawing(pos)
    }
  }

  const handleMouseUp = () => {
    stopDrawing()
  }

  // Touch events
  const handleTouchStart = (e) => {
    e.preventDefault()
    const pos = getTouchPos(e)
    startDrawing(pos)
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    const pos = getTouchPos(e)

    if (isDrawingRef.current) {
      continueDrawing(pos)
    }
  }

  const handleTouchEnd = (e) => {
    e.preventDefault()
    stopDrawing()
  }

  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  )
})

export default DrawingCanvas
