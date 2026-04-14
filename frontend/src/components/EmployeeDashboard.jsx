import { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeeDashboard = () => {
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
        },
      };

      try {
        const [attRes, leaveRes, annRes] = await Promise.all([
          axios.get('http://localhost:5000/api/attendance', config),
          axios.get('http://localhost:5000/api/leaves', config),
          axios.get('http://localhost:5000/api/announcements', config),
        ]);
        setAttendance(attRes.data);
        setLeaves(leaveRes.data);
        setAnnouncements(annRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleCheckIn = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token,
          },
        };

        try {
          await axios.post('http://localhost:5000/api/attendance/checkin', { latitude, longitude }, config);
          alert('Checked in successfully');
        } catch (err) {
          alert('Check-in failed');
        }
      });
    }
  };

  const handleCheckOut = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token,
          },
        };

        try {
          await axios.post('http://localhost:5000/api/attendance/checkout', { latitude, longitude }, config);
          alert('Checked out successfully');
        } catch (err) {
          alert('Check-out failed');
        }
      });
    }
  };

  return (
    <div className="dashboard">
      <h1>Employee Dashboard</h1>
      <div className="actions">
        <button onClick={handleCheckIn}>Check In</button>
        <button onClick={handleCheckOut}>Check Out</button>
      </div>
      <div className="sections">
        <section>
          <h2>My Attendance</h2>
          <ul>
            {attendance.map(att => (
              <li key={att._id}>{att.date} - {att.status}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>My Leaves</h2>
          <ul>
            {leaves.map(leave => (
              <li key={leave._id}>{leave.startDate} to {leave.endDate} - {leave.status}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Announcements</h2>
          <ul>
            {announcements.map(ann => (
              <li key={ann._id}>{ann.title}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default EmployeeDashboard;