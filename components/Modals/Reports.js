import React, { useState, useEffect } from 'react';
import styles from './Reports.module.css';
import reportsData from './reports.json';

export function Reports({ onClose }) {
  const [reports, setReports] = useState([]);
  const [activeFilters, setActiveFilters] = useState({
    category: 'all',
    difficulty: 'all',
    status: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real app, you might fetch this data
    setReports(reportsData.reports);
  }, []);

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? 'all' : value
    }));
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.strain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeFilters.category === 'all' || report.category === activeFilters.category;
    const matchesDifficulty = activeFilters.difficulty === 'all' || report.difficulty === activeFilters.difficulty;
    const matchesStatus = activeFilters.status === 'all' || report.status === activeFilters.status;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  return (
    <div className={styles.reportsContainer}>
      <button className={styles.closeButton} onClick={onClose}>×</button>
      
      <input
        type="search"
        placeholder="Search reports..."
        className={styles.searchBar}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className={styles.filtersSection}>
        <button
          className={`${styles.filter} ${activeFilters.category === 'indoor' ? styles.active : ''}`}
          onClick={() => handleFilterChange('category', 'indoor')}
        >
          Indoor
        </button>
        <button
          className={`${styles.filter} ${activeFilters.category === 'outdoor' ? styles.active : ''}`}
          onClick={() => handleFilterChange('category', 'outdoor')}
        >
          Outdoor
        </button>
        <button
          className={`${styles.filter} ${activeFilters.category === 'greenhouse' ? styles.active : ''}`}
          onClick={() => handleFilterChange('category', 'greenhouse')}
        >
          Greenhouse
        </button>
      </div>

      <div className={styles.reportsGrid}>
        {filteredReports.map(report => (
          <div key={report.id} className={styles.reportCard}>
            <img 
              src={report.imageUri} 
              alt={report.strain} 
              className={styles.reportImage}
            />
            <div className={styles.reportInfo}>
              <div className={styles.reportHeader}>
                <h3>{report.strain}</h3>
                <span className={`${styles.reportStatus} ${
                  report.status === 'completed' ? styles.statusCompleted : styles.statusInProgress
                }`}>
                  {report.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <p className={styles.reportDescription}>{report.description}</p>
              <div className={styles.reportDetails}>
                <span>Size: {report.plantSize}</span>
                <span>Speed: {report.growSpeed}</span>
                <span>Yield: {report.yield}</span>
              </div>
              <div className={styles.reportFooter}>
                <span>{report.author}</span>
                <span>{new Date(report.dateStarted).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reports;