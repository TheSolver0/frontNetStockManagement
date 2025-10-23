// BarChart.jsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Enregistrement des composants nécessaires
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Données du graphique
const data = {
  labels: ['Janvier', 'Février', 'Mars', 'Avril'],
  datasets: [
    {
      label: 'Ventes',
      data: [65, 59, 80, 81],
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
    },
  ],
};

// Options du graphique
const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Graphique des ventes',
    },
  },
};

const BarChart = () => {
  return <Bar data={data} options={options} />;
};

export default BarChart;
