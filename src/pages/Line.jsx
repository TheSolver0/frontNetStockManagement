// LineChart.jsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Enregistrement des composants requis pour le graphique en ligne
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Données du graphique
// const data = {
//   labels: ['Electronique', 'Menager', 'ElectroMenager'],
//   datasets: [
//     {
//       label: 'Nombre de ventes',
//       data: [130, 50, 60],
//       borderColor: 'rgb(27, 104, 220)',
//       backgroundColor: 'rgba(75, 192, 192, 0.2)',
//       tension: 0.5, // courbe lissée
//       fill: true,
//     },
//     {
//       label: 'Nombre d entrees d argent',
//       data: [30, 5, 6],
//       borderColor: 'rgb(82, 220, 27)',
//       backgroundColor: 'rgba(75, 192, 192, 0.2)',
//       tension: 0.5, // courbe lissée
//       fill: true,
//     },
//   ],
// };

// Options du graphique
const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Graphique en fonction des produits',
    },
  },
  scales: {
    y: {
          beginAtZero: true,
          stacked: true,
    },
  },
};

const LineChart = ({data}) => {
  // if (!data || !data.datasets) return null;
  console.log('dataline', data);
  if (!data || !data.labels || !data.datasets) return <p>Données en cours de chargement...</p>;
  return <Line data={data} options={options} />;
};

export default LineChart;
