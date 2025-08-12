import React from 'react';
import { Form, Radio, DatePicker } from 'antd';

/**
 * BundleSection - renders a section of form fields for a bundle
 * Props:
 * - id: string (section id)
 * - title: string (section title)
 * - fields: array of { key, label, type, options, required }
 */
const BundleSection = ({ id, title, fields }) => (
  <div id={id} className="bg-purple-100 rounded-md p-4 mb-6">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    <div className="space-y-4">
      {fields.map(({ key, label, type, options, required }) => (
        <Form.Item
          key={key}
          label={label}
          name={key}
          rules={required ? [{ required: true, message: 'This field is required.' }] : []}
        >
          {type === 'date' ? (
            <DatePicker className="w-full" />
          ) : (
            <Radio.Group className="flex space-x-8">
              {options.map(option => (
                <Radio key={option} value={option}>
                  {option}
                </Radio>
              ))}
            </Radio.Group>
          )}
        </Form.Item>
      ))}
    </div>
  </div>
);

export default BundleSection;