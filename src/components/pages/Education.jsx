import React from 'react';
import { BookOpen, ExternalLink, Download, Play } from 'lucide-react';

const Education = () => {
  const resources = [
    {
      title: "WHO Hand Hygiene Guidelines",
      type: "Guidelines",
      description: "Complete WHO guidelines for hand hygiene in healthcare settings",
      url: "https://www.who.int/teams/integrated-health-services/infection-prevention-control/hand-hygiene",
      icon: BookOpen
    },
    {
      title: "Hand Hygiene Technique Video",
      type: "Video",
      description: "Step-by-step demonstration of proper handwashing technique",
      url: "#",
      icon: Play
    },
    {
      title: "NICU-Specific Hand Hygiene Protocol",
      type: "Protocol",
      description: "Specialized guidelines for hand hygiene in neonatal intensive care units",
      url: "#",
      icon: Download
    },
    {
      title: "Alcohol-Based Hand Rub Technique",
      type: "Infographic",
      description: "Visual guide for proper alcohol-based hand sanitizer use",
      url: "#",
      icon: BookOpen
    }
  ];

  const whoMoments = [
    {
      number: 1,
      title: "Before touching a patient",
      description: "Protect the patient from harmful germs carried on your hands",
      examples: ["Before approaching the patient", "Before physical examination", "Before providing care"]
    },
    {
      number: 2,
      title: "Before clean/aseptic procedures",
      description: "Protect the patient from harmful germs, including their own",
      examples: ["Before handling invasive devices", "Before wound care", "Before medication preparation"]
    },
    {
      number: 3,
      title: "After body fluid exposure risk",
      description: "Protect yourself and healthcare environment from harmful germs",
      examples: ["After contact with blood or body fluids", "After removing gloves", "After cleaning spills"]
    },
    {
      number: 4,
      title: "After touching a patient",
      description: "Protect yourself and healthcare environment from harmful germs",
      examples: ["After physical examination", "After patient care", "After helping with patient mobility"]
    },
    {
      number: 5,
      title: "After touching patient surroundings",
      description: "Protect yourself and healthcare environment from harmful germs",
      examples: ["After touching bed rails", "After contact with medical equipment", "After handling patient charts"]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Education & Resources</h1>
        <p className="text-gray-600 mt-1">Training materials and WHO guidelines for hand hygiene</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">WHO's 5 Moments for Hand Hygiene</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {whoMoments.map((moment) => (
            <div key={moment.number} className="bg-white p-4 rounded-md border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {moment.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{moment.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{moment.description}</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    {moment.examples.map((example, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Training Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <Icon className="h-6 w-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{resource.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {resource.type}
                      </span>
                      <a
                        href={resource.url}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Reference Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900 mb-3">Handwashing Technique</h3>
            <ol className="text-sm text-green-800 space-y-2">
              <li>1. Wet hands with water</li>
              <li>2. Apply soap to cover all surfaces</li>
              <li>3. Rub hands palm to palm</li>
              <li>4. Rub back of hands</li>
              <li>5. Interlace fingers</li>
              <li>6. Rub thumbs and fingertips</li>
              <li>7. Rinse with water</li>
              <li>8. Dry with single-use towel</li>
            </ol>
            <p className="text-xs text-green-700 mt-2">Duration: 40-60 seconds</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-medium text-orange-900 mb-3">Alcohol-Based Hand Rub</h3>
            <ol className="text-sm text-orange-800 space-y-2">
              <li>1. Apply product to palm</li>
              <li>2. Rub hands palm to palm</li>
              <li>3. Rub back of hands</li>
              <li>4. Interlace fingers</li>
              <li>5. Rub thumbs and fingertips</li>
              <li>6. Rub until hands are dry</li>
            </ol>
            <p className="text-xs text-orange-700 mt-2">Duration: 20-30 seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Education;