"use client"

const Toolbar = ({ tool, onToolChange, onClearCanvas }) => {
  const colors = [
    { name: "Black", value: "#000000" },
    { name: "Red", value: "#ff0000" },
    { name: "Blue", value: "#0000ff" },
    { name: "Green", value: "#00ff00" },
  ]

  const handleColorChange = (color) => {
    onToolChange({ ...tool, color })
  }

  const handleWidthChange = (e) => {
    onToolChange({ ...tool, width: Number.parseInt(e.target.value) })
  }

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <label>Color:</label>
        <div className="color-palette">
          {colors.map((color) => (
            <button
              key={color.value}
              className={`color-btn ${tool.color === color.value ? "active" : ""}`}
              style={{ backgroundColor: color.value }}
              onClick={() => handleColorChange(color.value)}
              title={color.name}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <label htmlFor="stroke-width">Width: {tool.width}px</label>
        <input
          id="stroke-width"
          type="range"
          min="1"
          max="20"
          value={tool.width}
          onChange={handleWidthChange}
          className="width-slider"
        />
      </div>

      <div className="toolbar-section">
        <button onClick={onClearCanvas} className="clear-btn" title="Clear canvas">
          🗑️ Clear
        </button>
      </div>
    </div>
  )
}

export default Toolbar
