using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using fgt_sdk;
using fgt_sdk.Enums;
using fgt_sdk.Structs;

namespace chem0530
{
    public partial class Form3 : Form
    {

        //private Chart pressureChart;
        private Timer timer;
        private Button startButton, stopButton;
        private int timeX = 0; // 横坐标计数
        private uint sensorIndex = 0;

        public Form3()
        {
            InitializeComponent();
            this.Text = "Fluigent 压力传感器实时显示";
            this.Size = new Size(800, 600);

            // 添加按钮
            startButton = new Button() { Text = "开始读取", Location = new Point(10, 420), Width = 100 };
            stopButton = new Button() { Text = "停止读取", Location = new Point(120, 420), Width = 100 };
            startButton.Click += StartButton_Click;
            stopButton.Click += StopButton_Click;
            this.Controls.Add(startButton);
            this.Controls.Add(stopButton);

            // 定时器
            timer = new Timer();
            timer.Interval = 1000; // 每秒读取一次
            timer.Tick += Timer_Tick;
            var result = fgtSdk.Fgt_init();


        }

        private void StartButton_Click(object sender, EventArgs e)
        {
            timeX = 0;
            timer.Start();
        }

        private void StopButton_Click(object sender, EventArgs e)
        {
            timer.Stop();
        }

        private void Timer_Tick(object sender, EventArgs e)
        {
            var(result, pressureValue) = fgtSdk.Fgt_get_sensorValue(sensorIndex);
            if (result == 0)
            {
                MessageBox.Show(pressureValue.ToString());
            }
            else
            {
                timer.Stop();
                MessageBox.Show("读取传感器值失败，错误码: " + result);
            }
        }

        private void Form3_Load(object sender, EventArgs e)
        {

        }
    }
}
