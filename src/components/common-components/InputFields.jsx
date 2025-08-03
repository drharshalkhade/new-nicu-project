import React from 'react'
import { Input, InputNumber, Select } from 'antd'
import { Eye, EyeOff } from 'lucide-react'

// Helper for password visibility toggle
function PasswordInput(props) {
  const [visible, setVisible] = React.useState(false)
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        suffix={
          <span
            className="cursor-pointer"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        }
      />
    </div>
  )
}

/**
 * Renders a generic input field.
 * Supports type: text, email, password, number, select, etc.
 */
const InputField = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  options,
  ...rest
}) => {
  let inputNode

  switch (type) {
    case 'password':
      inputNode = (
        <PasswordInput
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...rest}
        />
      )
      break
    case 'number':
      inputNode = (
        <InputNumber
          name={name}
          value={value}
          onChange={val => onChange({ target: { name, value: val } })} // normalize event
          className="w-full"
          placeholder={placeholder}
          {...rest}
        />
      )
      break
    case 'select':
      inputNode = (
        <Select
          className="w-full"
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={val => onChange({ target: { name, value: val } })}
          options={options}
          {...rest}
        />
      )
      break
    default:
      inputNode = (
        <Input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...rest}
        />
      )
  }

  return (
    <div className="space-y-1 my-2">
      {label && <label className="block font-medium">{label}</label>}
      {inputNode}
    </div>
  )
}

export default InputField
