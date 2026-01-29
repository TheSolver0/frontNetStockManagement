import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Enregistrement des composants requis
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = ({ data, compact = false, title }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !data || !Array.isArray(data.datasets)) return;

    const ctx = chart.canvas.getContext('2d');
    
    // Palette de couleurs moderne et cohérente
    const colorPalette = [
      { border: '#1677ff', gradient: ['rgba(22, 119, 255, 0.35)', 'rgba(22, 119, 255, 0.01)'] }, // Ant Design blue
      { border: '#52c41a', gradient: ['rgba(82, 196, 26, 0.35)', 'rgba(82, 196, 26, 0.01)'] },   // Ant Design green
      { border: '#fa8c16', gradient: ['rgba(250, 140, 22, 0.35)', 'rgba(250, 140, 22, 0.01)'] }, // Ant Design orange
      { border: '#eb2f96', gradient: ['rgba(235, 47, 150, 0.35)', 'rgba(235, 47, 150, 0.01)'] }, // Ant Design magenta
      { border: '#722ed1', gradient: ['rgba(114, 46, 209, 0.35)', 'rgba(114, 46, 209, 0.01)'] }  // Ant Design purple
    ];

    data.datasets.forEach((dataset, i) => {
      const colors = colorPalette[i % colorPalette.length];
      const gradient = ctx.createLinearGradient(0, 0, 0, chart.canvas.height);
      
      gradient.addColorStop(0, colors.gradient[0]);
      gradient.addColorStop(1, colors.gradient[1]);

      dataset.backgroundColor = gradient;
      dataset.borderColor = colors.border;
      dataset.borderWidth = compact ? 2 : 3;
      dataset.pointBackgroundColor = '#ffffff';
      dataset.pointBorderColor = colors.border;
      dataset.pointBorderWidth = compact ? 2 : 3;
      dataset.pointRadius = compact ? 0 : 4;
      dataset.pointHoverRadius = compact ? 5 : 7;
      dataset.pointHoverBorderWidth = compact ? 3 : 4;
      dataset.fill = true;
      dataset.tension = 0.4;
    });

    chart.update();
  }, [data, compact]);

  // Options du graphique avec style moderne
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: !compact,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: compact ? 10 : 15,
          font: { 
            size: compact ? 11 : 13, 
            weight: '600',
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          },
          color: '#595959'
        }
      },
      title: {
        display: !!title,
        text: title,
        font: { 
          size: compact ? 14 : 16, 
          weight: '700',
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        color: '#262626',
        padding: { bottom: compact ? 12 : 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: compact ? 8 : 12,
        borderColor: 'rgba(217, 217, 217, 0.3)',
        borderWidth: 1,
        titleFont: { 
          size: compact ? 12 : 14, 
          weight: '600',
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        bodyFont: { 
          size: compact ? 11 : 13,
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            // Format number with spaces for thousands (French style)
            label += context.parsed.y.toLocaleString('fr-FR');
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: { 
            size: compact ? 10 : 12, 
            weight: '500',
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          },
          color: '#8c8c8c',
          maxRotation: compact ? 45 : 0,
          minRotation: compact ? 45 : 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
          drawBorder: false
        },
        ticks: {
          font: { 
            size: compact ? 10 : 12, 
            weight: '500',
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          },
          color: '#8c8c8c',
          callback: (value) => {
            // Format with French locale
            return value.toLocaleString('fr-FR');
          }
        }
      }
    },
    animation: compact ? false : {
      duration: 750,
      easing: 'easeInOutQuart'
    }
  };

  if (!data || !data.labels || !data.datasets) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: compact ? '220px' : '340px',
        color: '#8c8c8c',
        fontSize: '14px'
      }}>
        <span>📊 Chargement des données...</span>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: compact ? '220px' : '340px',
      position: 'relative'
    }}>
      <Line ref={chartRef} data={data} options={chartOptions} />
    </div>
  );
};

export default LineChart;
