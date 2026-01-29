import React, { useRef, useEffect } from 'react';
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

// Enregistrement des composants requis
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ data, compact = false, title }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !data || !Array.isArray(data.datasets)) return;

    const ctx = chart.canvas.getContext('2d');
    
    // Palette de couleurs avec gradients
    const gradientColors = [
      ['#1677ff', '#40a9ff'], // Blue gradient
      ['#52c41a', '#73d13d'], // Green gradient
      ['#fa8c16', '#ffa940'], // Orange gradient
      ['#eb2f96', '#f759ab'], // Magenta gradient
      ['#722ed1', '#9254de']  // Purple gradient
    ];

    data.datasets.forEach((dataset, i) => {
      const [color1, color2] = gradientColors[i % gradientColors.length];
      const gradient = ctx.createLinearGradient(0, 0, 0, chart.canvas.height);
      
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);

      dataset.backgroundColor = gradient;
      dataset.borderRadius = compact ? 4 : 6;
      dataset.borderSkipped = false;
      dataset.barPercentage = 0.7;
      dataset.categoryPercentage = 0.8;
    });

    chart.update();
  }, [data, compact]);

  // Options du graphique
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
          pointStyle: 'rect',
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
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
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
          callback: (value) => value.toLocaleString('fr-FR')
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
      <Bar ref={chartRef} data={data} options={chartOptions} />
    </div>
  );
};

export default BarChart;
