import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
        },
      };

      try {
        const [empRes, attRes, leaveRes] = await Promise.all([
          axios.get('http://localhost:5000/api/employees', config),
          axios.get('http://localhost:5000/api/attendance/all', config),
          axios.get('http://localhost:5000/api/leaves/all', config),
        ]);
        setEmployees(empRes.data);
        setAttendance(attRes.data);
        setLeaves(leaveRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      <div className="stats">
        <div>Total Employees: {employees.length}</div>
        <div>Present Today: {attendance.filter(a => a.status === 'present').length}</div>
        <div>On Leave: {leaves.filter(l => l.status === 'approved').length}</div>
      </div>
      <div className="sections">
        <section>
          <h2>Employees</h2>
          <ul>
            {employees.map(emp => (
              <li key={emp._id}>{emp.name} - {emp.employeeId}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Recent Attendance</h2>
          <ul>
            {attendance.slice(0, 10).map(att => (
              <li key={att._id}>{att.employee.name} - {att.status}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Leave Requests</h2>
          <ul>
            {leaves.filter(l => l.status === 'pending').map(leave => (
              <li key={leave._id}>{leave.employee.name} - {leave.reason}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;