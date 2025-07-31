$(document).ready(function() {
    const token = sessionStorage.getItem('token');
    let barChart, pieChart, lineChart, loyalChart;
    

    if (!token) return window.location.href = "/frontend/Userhandling/login.html";

    // Function to show/hide no data message and chart
    function toggleNoData(chartType, show) {
        const $container = $(`#${chartType}Container`);
        const $canvas = $(`#${chartType}`);
        const $noData = $(`#${chartType}NoData`);
        
        if (show) {
            $canvas.hide();
            $noData.show();
            $container.css('background', 'rgba(255, 255, 255, 0.7)');
        } else {
            $canvas.show();
            $noData.hide();
            $container.css('background', 'transparent');
        }
    }

    // Function to destroy chart if exists
    function destroyChart(chartInstance) {
        if (chartInstance) {
            chartInstance.destroy();
        }
    }

    // Function to load all charts
    function loadCharts(month = 'all', year = '2025') {
        // Show loading
        toggleNoData('pie', true);
        toggleNoData('bar', true);
        toggleNoData('line', true);
        toggleNoData('loyal', true);
        $('#pieNoData').text('Loading...');
        $('#barNoData').text('Loading...');
        $('#lineNoData').text('Loading...');
        $('#loyalNoData').text('Loading...');

        // Pie chart: Most sold products
        $.ajax({
            url: `http://localhost:4000/api/v1/charts/most-sold-products?year=${year}${month !== 'all' ? `&month=${month}` : ''}`,
            headers: { 'Authorization': `Bearer ${token}` },
            success: data => {
                const hasData = data && data.length > 0 && data.some(d => d.total_sold > 0);
                
                if (!hasData) {
                    destroyChart(pieChart);
                    $('#pieNoData').text('No Products Sold');
                    return;
                }

                const labels = data.map(d => d.name);
                const values = data.map(d => d.total_sold);
                
                destroyChart(pieChart);
                toggleNoData('pie', false);
                
                pieChart = new Chart(document.getElementById('pieChart'), {
                    type: 'pie',
                    data: { 
                        labels, 
                        datasets: [{ 
                            label: 'Most Sold Products', 
                            data: values,
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.7)',
                                'rgba(54, 162, 235, 0.7)',
                                'rgba(255, 206, 86, 0.7)',
                                'rgba(75, 192, 192, 0.7)',
                                'rgba(153, 102, 255, 0.7)'
                            ]
                        }] 
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'right' }
                        }
                    }
                });
            },
            error: () => {
                destroyChart(pieChart);
                $('#pieNoData').text('Error Loading Data');
            }
        });

        // Bar chart: Monthly sales
        $.ajax({
            url: `http://localhost:4000/api/v1/charts/monthly-sales?year=${year}`,
            headers: { 'Authorization': `Bearer ${token}` },
            success: data => {
                let filteredData = data;
                if (month !== 'all') {
                    filteredData = data.filter(d => {
                        const [dataYear, dataMonth] = d.month.split('-');
                        return dataMonth === month.toString().padStart(2, '0');
                    });
                }
                
                const hasData = filteredData && filteredData.length > 0 && filteredData.some(d => d.total_sales > 0);
                
                if (!hasData) {
                    destroyChart(barChart);
                    $('#barNoData').text(month === 'all' ? 'No Sales This Year' : 'No Sales This Month');
                    return;
                }

                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const labels = filteredData.map(d => {
                    const [yearStr, monthNum] = d.month.split('-');
                    return monthNames[parseInt(monthNum) - 1] + ' ' + yearStr;
                });
                const values = filteredData.map(d => d.total_sales);
                
                destroyChart(barChart);
                toggleNoData('bar', false);
                
                barChart = new Chart(document.getElementById('barChart'), {
                    type: 'bar',
                    data: { 
                        labels, 
                        datasets: [{ 
                            label: 'Monthly Sales', 
                            data: values,
                            backgroundColor: 'rgba(153, 102, 255, 0.7)'
                        }] 
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { y: { beginAtZero: true } }
                    }
                });
            },
            error: () => {
                destroyChart(barChart);
                $('#barNoData').text('Error Loading Data');
            }
        });

        // Line chart: Orders by address
        $.ajax({
            url: `http://localhost:4000/api/v1/charts/orders-by-address?year=${year}${month !== 'all' ? `&month=${month}` : ''}`,
            headers: { 'Authorization': `Bearer ${token}` },
            success: data => {
                const hasData = data && data.length > 0 && data.some(d => d.total_orders > 0);
                
                if (!hasData) {
                    destroyChart(lineChart);
                    $('#lineNoData').text('No Orders Found');
                    return;
                }

                const labels = data.map(d => d.address);
                const values = data.map(d => d.total_orders);
                
                destroyChart(lineChart);
                toggleNoData('line', false);
                
                lineChart = new Chart(document.getElementById('lineChart'), {
                    type: 'line',
                    data: { 
                        labels, 
                        datasets: [{ 
                            label: 'Orders by Address', 
                            data: values,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.1,
                            fill: true
                        }] 
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { y: { beginAtZero: true } }
                    }
                });
            },
            error: () => {
                destroyChart(lineChart);
                $('#lineNoData').text('Error Loading Data');
            }
        });

        // Loyal customers chart
$('#loyalCustomersList').html('<p class="loading-text">Loading loyal customers...</p>');

$.ajax({
    url: `http://localhost:4000/api/v1/charts/most-loyal-customers?year=${year}${month !== 'all' ? `&month=${month}` : ''}`,
    headers: { 'Authorization': `Bearer ${token}` },
    success: data => {
        const hasData = data && data.length > 0 && data.some(d => d.total_items_purchased > 0);

        if (!hasData) {
            $('#loyalCustomersList').html('<p class="no-data-text">No Loyal Customers Found</p>');
            return;
        }

        const cardsHtml = data.map(d => `
            <div class="loyal-card">
                <div style="font-size: 18px; font-weight: 600;">${d.name}</div>
                <div style="margin-top: 5px; font-size: 14px;">Purchased Items: ${d.total_items_purchased}</div>
            </div>
        `).join('');

        $('#loyalCustomersList').html(cardsHtml);
    },
    error: () => {
        $('#loyalCustomersList').html('<p class="no-data-text">Error Loading Loyal Customers</p>');
    }
});


    }

    // Initial load
    loadCharts();

    // Filter change events
    $('#monthFilter, #yearFilter').change(function() {
        const month = $('#monthFilter').val();
        const year = $('#yearFilter').val();
        loadCharts(month, year);
    });




});
