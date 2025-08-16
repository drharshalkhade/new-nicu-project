import React, { useState, useEffect } from 'react';
import { Select, Card, Button, Spin } from 'antd';
import { Filter, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '../../lib/supabaseClient';

const { Option } = Select;

const HierarchyFilter = ({ onFilterChange }) => {
  const dispatch = useDispatch();
  const userDetails = useSelector(state => state.user.userDetails);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [nicuAreas, setNicuAreas] = useState([]);
  
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedNicuArea, setSelectedNicuArea] = useState(null);

  useEffect(() => {
    // Only fetch organizations if user is super admin
    if (userDetails?.role === 'super_admin') {
      fetchOrganizations();
    }
  }, [userDetails?.role]);

  // Only show for super admins
  if (userDetails?.role !== 'super_admin') {
    return null;
  }

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async (organizationId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setHospitals(data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (hospitalId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('hospital_id', hospitalId)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNicuAreas = async (departmentId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nicu_areas')
        .select('id, name')
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setNicuAreas(data || []);
    } catch (error) {
      console.error('Error fetching NICU areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (orgId) => {
    setSelectedOrg(orgId);
    setSelectedHospital(null);
    setSelectedDepartment(null);
    setSelectedNicuArea(null);
    setHospitals([]);
    setDepartments([]);
    setNicuAreas([]);
    
    if (orgId) {
      fetchHospitals(orgId);
      onFilterChange({ organizationId: orgId });
    } else {
      onFilterChange({});
    }
  };

  const handleHospitalChange = (hospitalId) => {
    setSelectedHospital(hospitalId);
    setSelectedDepartment(null);
    setSelectedNicuArea(null);
    setDepartments([]);
    setNicuAreas([]);
    
    if (hospitalId) {
      fetchDepartments(hospitalId);
      onFilterChange({ 
        organizationId: selectedOrg, 
        hospitalId: hospitalId 
      });
    } else {
      onFilterChange({ organizationId: selectedOrg });
    }
  };

  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartment(departmentId);
    setSelectedNicuArea(null);
    setNicuAreas([]);
    
    if (departmentId) {
      fetchNicuAreas(departmentId);
      onFilterChange({ 
        organizationId: selectedOrg, 
        hospitalId: selectedHospital, 
        departmentId: departmentId 
      });
    } else {
      onFilterChange({ 
        organizationId: selectedOrg, 
        hospitalId: selectedHospital 
      });
    }
  };

  const handleNicuAreaChange = (nicuAreaId) => {
    setSelectedNicuArea(nicuAreaId);
    
    onFilterChange({ 
      organizationId: selectedOrg, 
      hospitalId: selectedHospital, 
      departmentId: selectedDepartment, 
      nicuAreaId: nicuAreaId 
    });
  };

  const clearFilters = () => {
    setSelectedOrg(null);
    setSelectedHospital(null);
    setSelectedDepartment(null);
    setSelectedNicuArea(null);
    setHospitals([]);
    setDepartments([]);
    setNicuAreas([]);
    onFilterChange({});
  };

  const hasActiveFilters = selectedOrg || selectedHospital || selectedDepartment || selectedNicuArea;

  return (
    <Card 
      size="small" 
      className="mb-6"
      title={
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>Data Filter</span>
          {hasActiveFilters && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Filtered
            </span>
          )}
        </div>
      }
      extra={
        hasActiveFilters && (
          <Button 
            type="text" 
            size="small" 
            icon={<X className="h-3 w-3" />}
            onClick={clearFilters}
          >
            Clear
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization
          </label>
          <Select
            placeholder="Select Organization"
            value={selectedOrg}
            onChange={handleOrgChange}
            allowClear
            loading={loading}
            className="w-full"
          >
            {organizations.map(org => (
              <Option key={org.id} value={org.id}>
                {org.name}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hospital
          </label>
          <Select
            placeholder="Select Hospital"
            value={selectedHospital}
            onChange={handleHospitalChange}
            allowClear
            disabled={!selectedOrg}
            loading={loading}
            className="w-full"
          >
            {hospitals.map(hospital => (
              <Option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <Select
            placeholder="Select Department"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            allowClear
            disabled={!selectedHospital}
            loading={loading}
            className="w-full"
          >
            {departments.map(dept => (
              <Option key={dept.id} value={dept.id}>
                {dept.name}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            NICU Area
          </label>
          <Select
            placeholder="Select NICU Area"
            value={selectedNicuArea}
            onChange={handleNicuAreaChange}
            allowClear
            disabled={!selectedDepartment}
            loading={loading}
            className="w-full"
          >
            {nicuAreas.map(area => (
              <Option key={area.id} value={area.id}>
                {area.name}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <div className="text-sm text-blue-800">
            <strong>Active Filters:</strong>
            <div className="mt-1 space-y-1">
              {selectedOrg && (
                <div>Organization: {organizations.find(o => o.id === selectedOrg)?.name}</div>
              )}
              {selectedHospital && (
                <div>Hospital: {hospitals.find(h => h.id === selectedHospital)?.name}</div>
              )}
              {selectedDepartment && (
                <div>Department: {departments.find(d => d.id === selectedDepartment)?.name}</div>
              )}
              {selectedNicuArea && (
                <div>NICU Area: {nicuAreas.find(n => n.id === selectedNicuArea)?.name}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default HierarchyFilter; 