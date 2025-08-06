import React from 'react';
import { Form, Radio } from 'antd';

/**
 * BundleSection - renders a section of form fields for a bundle
 * Props:
 * - id: string (section id)
 * - title: string (section title)
 * - fields: array of { key, label }
 */
const BundleSection = ({ id, title, fields }) => (
  <div id={id} className="bg-purple-100 rounded-md p-4 mb-6">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map(({ key, label }) => (
        <Form.Item
          key={key}
          label={label}
          name={key}
          rules={[{ required: true, message: 'This field is required.' }]}
        >
          <Radio.Group className="flex space-x-8">
            <Radio value="Yes">Yes</Radio>
            <Radio value="No">No</Radio>
          </Radio.Group>
        </Form.Item>
      ))}
    </div>
  </div>
);

export default BundleSection;