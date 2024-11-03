import React, { useState } from 'react';
import { User, Calendar, MapPin, Leaf, Scale, Heart, TreePine, Globe, Mail } from 'lucide-react';
import fundData from './FundSample.json';
import styles from './Fund.module.css';

export const FundModal = ({ onClose }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [fundAmount, setFundAmount] = useState('');

  const handleFund = (projectId) => {
    console.log(`Funding ${fundAmount} to project ${projectId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className={styles.header}>
            <div>
              <p className={styles.subtitle}>Support environmental conservation and earn carbon credits</p>
            </div>
          </div>

          {/* Featured Projects */}
          <div className={styles.projectsGrid}>
            {fundData.featured_projects.map((project) => (
              <div key={project.id} className={styles.projectCard}>
                <img
                  src={project.imageUrl}
                  alt={project.name}
                  className={styles.projectImage}
                />
                <div className={styles.projectContent}>
                  <h3 className={styles.projectTitle}>{project.name}</h3>
                  <div className={styles.projectInfo}>
                    <div className={styles.infoItem}>
                      <User className={styles.icon} />
                      {project.organization}
                    </div>
                    <div className={styles.infoItem}>
                      <MapPin className={styles.icon} />
                      {project.location}
                    </div>
                    <div className={styles.infoItem}>
                      <Scale className={styles.icon} />
                      {project.carbonCredits} CO₂ output target
                    </div>
                  </div>

                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ width: `${(project.raisedAmount / project.targetAmount) * 100}%` }}
                      />
                    </div>
                    <div className={styles.amountInfo}>
                      <span className={styles.amount}>
                      CO₂ {project.raisedAmount.toLocaleString()}
                      </span>
                      <span className={styles.amount}>
                      CO₂ {project.targetAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProject(project)}
                    className={styles.fundButton}
                  >
                    Fund Project
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <TreePine className={`${styles.statIcon} text-green-500`} />
              <div className={`${styles.statValue} text-green-500`}>
                {fundData.platform_stats.trees_planted.toLocaleString()}
              </div>
              <div className={styles.statLabel}>Trees Planted</div>
            </div>
            <div className={styles.statCard}>
              <Scale className={`${styles.statIcon} text-blue-500`} />
              <div className={`${styles.statValue} text-blue-500`}>
                {fundData.platform_stats.carbon_credits.toLocaleString()}
              </div>
              <div className={styles.statLabel}>CC Generated</div>
            </div>
            <div className={styles.statCard}>
              <Globe className={`${styles.statIcon} text-purple-500`} />
              <div className={`${styles.statValue} text-purple-500`}>
                {fundData.platform_stats.countries}
              </div>
              <div className={styles.statLabel}>Countries</div>
            </div>
            <div className={styles.statCard}>
              <Heart className={`${styles.statIcon} text-red-500`} />
              <div className={`${styles.statValue} text-red-500`}>
                {fundData.platform_stats.supporters.toLocaleString()}
              </div>
              <div className={styles.statLabel}>Supporters</div>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className={styles.newsletter}>
            <div className={styles.newsletterContent}>
              <Mail className={`${styles.icon} text-green-500`} />
              <div className={styles.newsletterInfo}>
                <h3 className={styles.newsletterTitle}>Stay Updated</h3>
                <p className={styles.subtitle}>Get notifications about new projects and impact reports</p>
              </div>
              <button className={styles.subscribeButton}>
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Funding Modal */}
      {selectedProject && (
        <div className={styles.fundingModal}>
          <div className={styles.fundingContent}>
            <h3 className={styles.fundingTitle}>Fund {selectedProject.name}</h3>
            <div className={styles.inputContainer}>
              <label className={styles.inputLabel}>
              CO₂
              </label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className={styles.input}
                placeholder="Enter amount..."
              />
            </div>
            <div className={styles.buttonGroup}>
              <button
                onClick={() => handleFund(selectedProject.id)}
                className={styles.confirmButton}
              >
                Confirm
              </button>
              <button
                onClick={() => setSelectedProject(null)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};