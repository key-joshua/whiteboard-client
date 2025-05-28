"use client"

import { useState, useEffect, useRef } from "react"
import io from "socket.io-client"
import DrawingCanvas from "./DrawingCanvas"
import Toolbar from "./Toolbar"
import UserCursors from "./UserCursors"

const Whiteboard = ({ roomId, initialDrawingData }) => {
  const [socket, setSocket] = useState(null)
  const [userCount, setUserCount] = useState(0)
  const [cursors, setCursors] = useState({})
  const [tool, setTool] = useState({
    color: "#000000",
    width: 2,
  })

  const canvasRef = useRef(null)
  const cursorThrottleRef = useRef(null)

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL)
    setSocket(newSocket)

    // Join room
    newSocket.emit("join-room", roomId)

    // Socket event listeners
    newSocket.on("user-count-update", (count) => {
      setUserCount(count)
    })

    newSocket.on("cursor-move", (data) => {
      setCursors((prev) => ({
        ...prev,
        [data.userId]: {
          x: data.x,
          y: data.y,
          color: data.color || "#ff0000",
        },
      }))
    })

    newSocket.on("canvas-cleared", () => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas()
      }
    })

    return () => {
      newSocket.disconnect()
    }
  }, [roomId])

  const handleCursorMove = (x, y) => {
    if (!socket) return

    // Throttle cursor updates to ~60fps
    if (cursorThrottleRef.current) {
      clearTimeout(cursorThrottleRef.current)
    }

    cursorThrottleRef.current = setTimeout(() => {
      socket.emit("cursor-move", {
        x,
        y,
        color: tool.color,
      })
    }, 16) // ~60fps
  }

  const handleClearCanvas = () => {
    if (socket) {
      socket.emit("clear-canvas")
    }
    if (canvasRef.current) {
      canvasRef.current.clearCanvas()
    }
  }

  return (
    <div className="whiteboard">
      <div className="whiteboard-header">
        <Toolbar tool={tool} onToolChange={setTool} onClearCanvas={handleClearCanvas} />
        <div className="user-info">
          <span className="user-count">
            👥 {userCount} user{userCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="canvas-container">
        <DrawingCanvas
          ref={canvasRef}
          socket={socket}
          tool={tool}
          initialDrawingData={initialDrawingData}
          onCursorMove={handleCursorMove}
        />
        <UserCursors cursors={cursors} />
      </div>
    </div>
  )
}

export default Whiteboard
