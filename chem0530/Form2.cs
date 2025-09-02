using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Net.Sockets;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Threading;

namespace chem0530
{
    public partial class Form2 : Form
    {
        // 本地设置
        private readonly IPAddress localIp = IPAddress.Parse("192.168.1.11");
        private readonly int localSendPort = 2030;
        private readonly int[] localReceivePorts = { 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029 };

        // 对方设置
        private readonly IPAddress remoteIp = IPAddress.Parse("192.168.1.255");
        private readonly int remotePort = 8080;

        private UdpClient sendClient;
        private List<UdpClient> receiveClients = new List<UdpClient>();
        private bool isRunning = false;

        //器件初始化
        public Bump[,] bumps = new Bump[4, 6];
        public Valve[,] valves = new Valve[4,4];
        public Mfc[] mfc = new Mfc[4];
        public Light[] light = new Light[4];
        public Heat[,] heats = new Heat[4,6];

        public Form2()
        {
            InitializeComponent();
            numericUpDown36.Value = 2292;


            for (int i = 0; i < 4; i++)
            {
                for (int j = 0; j < 6; j++)
                {
                    bumps[i, j] = new Bump(); // 初始化每个元素
                }
            }

            for (int i = 0; i < 4; i++)
            {
                for (int j = 0; j < 4; j++)
                {
                    valves[i, j] = new Valve(); // 初始化每个元素
                }
            }

            for (int i = 0; i < 4; i++)
            {
                mfc[i] = new Mfc(); // 初始化每个元素
            }

            for (int i = 0; i < 4; i++)
            {
                light[i] = new Light(); // 初始化每个元素
            }

            for (int i = 0; i < 4; i++)
            {
                for (int j = 0; j < 6; j++)
                {
                    heats[i, j] = new Heat(); // 初始化每个元素
                }
            }
            //StartReceiving();
        }

        private void StartReceiving()
        {
            isRunning = true;

            foreach (var port in localReceivePorts)
            {
                var client = new UdpClient(port);
                receiveClients.Add(client);

                ThreadPool.QueueUserWorkItem(state =>
                {
                    var udpClient = (UdpClient)state;
                    var endPoint = new IPEndPoint(IPAddress.Any, 0);

                    while (isRunning)
                    {
                        try
                        {
                            byte[] receivedBytes = udpClient.Receive(ref endPoint);

                            // 在UI线程上更新接收到的数据
                            /*this.Invoke((MethodInvoker)delegate
                            {
                                var hexString = BitConverter.ToString(receivedBytes).Replace("-", " ");
                                txtReceive.AppendText($"从 {endPoint.Address}:{endPoint.Port} 接收 (端口 {((IPEndPoint)udpClient.Client.LocalEndPoint).Port}):\r\n");
                                txtReceive.AppendText(hexString + "\r\n\r\n");
                                txtReceive.ScrollToCaret();
                            });*/
                        }
                        catch (SocketException ex)
                        {
                            if (isRunning)
                            {
                                /*this.Invoke((MethodInvoker)delegate
                                {
                                    txtReceive.AppendText($"接收错误 (端口 {((IPEndPoint)udpClient.Client.LocalEndPoint).Port}): {ex.Message}\r\n");
                                });*/
                                Console.WriteLine(ex);
                            }
                        }
                    }
                }, client);
            }
        }

        private void SendData()
        {
            try
            {
                if (sendClient == null)
                {
                    sendClient = new UdpClient(new IPEndPoint(localIp, localSendPort));
                    sendClient.EnableBroadcast = true;
                }

                // 转换HEX字符串为字节数组 AA BB CC DD EE FF 32 71 00 00 20 00 0F F0 01 00 06 01 00 00 05 DC 02 00 16 02 05 DC 0B B8 03 00 26 03 0B B8 11 94 04 00 36 04 11 94 17 70 
                //byte[] sendBytes = HexStringToByteArray(hexString);
                byte[] header_bytes = {
                    0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF,
                    0x32, 0x71, 0x00, 0x00, 0x20, 0x00,
                    0x0F, 0xF0, 0x01, 0x00, 0x06, 0x01,
                    0x00, 0x00, 0x05, 0xDC, 0x02, 0x00,
                    0x16, 0x02, 0x05, 0xDC, 0x0B, 0xB8,
                    0x03, 0x00, 0x26, 0x03, 0x0B, 0xB8,
                    0x11, 0x94, 0x04, 0x00, 0x36, 0x04,
                    0x11, 0x94, 0x17, 0x70
                   };
                byte[] data1 = {
                (byte)(bumps[0, 0].Speed >> 8),
                (byte)bumps[0, 0].Speed,
                (byte)(bumps[0, 0].SetPosition >> 8),
                (byte)bumps[0, 0].SetPosition,
                bumps[0, 0].info,
                bumps[0, 0].Port,
                (byte)(bumps[0, 1].Speed >> 8),
                (byte)bumps[0, 1].Speed,
                (byte)(bumps[0, 1].SetPosition >> 8),
                (byte)bumps[0, 1].SetPosition,
                bumps[0, 1].info,
                bumps[0, 1].Port,
                (byte)(bumps[0, 2].Speed >> 8),
                (byte)bumps[0, 2].Speed,
                (byte)(bumps[0, 2].SetPosition >> 8),
                (byte)bumps[0, 2].SetPosition,
                bumps[0, 2].info,
                bumps[0, 2].Port,
                (byte)(bumps[0, 3].Speed >> 8),
                (byte)bumps[0, 3].Speed,
                (byte)(bumps[0, 3].SetPosition >> 8),
                (byte)bumps[0, 3].SetPosition,
                bumps[0, 3].info,
                bumps[0, 3].Port,
                (byte)(bumps[0, 4].Speed >> 8),
                (byte)bumps[0, 4].Speed,
                (byte)(bumps[0, 4].SetPosition >> 8),
                (byte)bumps[0, 4].SetPosition,
                bumps[0, 4].info,
                bumps[0, 4].Port,
                (byte)(bumps[0, 5].Speed >> 8),
                (byte)bumps[0, 5].Speed,
                (byte)(bumps[0, 5].SetPosition >> 8),
                (byte)bumps[0, 5].SetPosition,

                bumps[0, 5].info,
                bumps[0, 5].Port,
                valves[0,0].info,
                valves[0,0].Port,
                valves[0,1].info,
                valves[0,1].Port,

                valves[0,2].info,
                valves[0,2].Port,
                valves[0,3].info,
                valves[0,3].Port,

                mfc[0].info,
                (byte)(mfc[0].set_speed>>8),
                (byte)mfc[0].set_speed,

                light[0].info,
                (byte)(light[0].set_strength>>8),
                (byte)light[0].set_strength,

                heats[0,0].info,
                heats[0,0].pwm,
                (byte)(heats[0,0].set_temp>>8),
                (byte)heats[0,0].set_temp,
                heats[0,1].info,
                heats[0,1].pwm,
                (byte)(heats[0,1].set_temp>>8),
                (byte)heats[0,1].set_temp,
                heats[0,2].info,
                heats[0,2].pwm,
                (byte)(heats[0,2].set_temp>>8),
                (byte)heats[0,2].set_temp,
                heats[0,3].info,
                heats[0,3].pwm,
                (byte)(heats[0,3].set_temp>>8),
                (byte)heats[0,3].set_temp,
                heats[0,4].info,
                heats[0,4].pwm,
                (byte)(heats[0,4].set_temp>>8),
                (byte)heats[0,4].set_temp,
                heats[0,5].info,
                heats[0,5].pwm,
                (byte)(heats[0,5].set_temp>>8),
                (byte)heats[0,5].set_temp,
                0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

                (byte)(bumps[1, 0].Speed >> 8),
                (byte)bumps[1, 0].Speed,
                (byte)(bumps[1, 0].SetPosition >> 8),
                (byte)bumps[1, 0].SetPosition,
                bumps[1, 0].info,
                bumps[1, 0].Port,
                (byte)(bumps[1, 1].Speed >> 8),
                (byte)bumps[1, 1].Speed,
                (byte)(bumps[1, 1].SetPosition >> 8),
                (byte)bumps[1, 1].SetPosition,
                bumps[1, 1].info,
                bumps[1, 1].Port,
                (byte)(bumps[1, 2].Speed >> 8),
                (byte)bumps[1, 2].Speed,
                (byte)(bumps[1, 2].SetPosition >> 8),
                (byte)bumps[1, 2].SetPosition,
                bumps[1, 2].info,
                bumps[1, 2].Port,
                (byte)(bumps[1, 3].Speed >> 8),
                (byte)bumps[1, 3].Speed,
                (byte)(bumps[1, 3].SetPosition >> 8),
                (byte)bumps[1, 3].SetPosition,
                bumps[1, 3].info,
                bumps[1, 3].Port,
                (byte)(bumps[1, 4].Speed >> 8),
                (byte)bumps[1, 4].Speed,
                (byte)(bumps[1, 4].SetPosition >> 8),
                (byte)bumps[1, 4].SetPosition,
                bumps[1, 4].info,
                bumps[1, 4].Port,
                (byte)(bumps[1, 5].Speed >> 8),
                (byte)bumps[1, 5].Speed,
                (byte)(bumps[1, 5].SetPosition >> 8),
                (byte)bumps[1, 5].SetPosition,
                bumps[1, 5].info,
                bumps[1, 5].Port,

                valves[1,0].info,
                valves[1,0].Port,
                valves[1,1].info,
                valves[1,1].Port,
                valves[1,2].info,
                valves[1,2].Port,
                valves[1,3].info,
                valves[1,3].Port,

                mfc[1].info,
                (byte)(mfc[1].set_speed>>8),
                (byte)mfc[1].set_speed,

                light[1].info,
                (byte)(light[1].set_strength>>8),
                (byte)light[1].set_strength,

                heats[1,0].info,
                heats[1,0].pwm,
                (byte)(heats[1,0].set_temp>>8),
                (byte)heats[1,0].set_temp,
                heats[1,1].info,
                heats[1,1].pwm,
                (byte)(heats[1,1].set_temp>>8),
                (byte)heats[1,1].set_temp,
                heats[1,2].info,
                heats[1,2].pwm,
                (byte)(heats[1,2].set_temp>>8),
                (byte)heats[1,2].set_temp,
                heats[1,3].info,
                heats[1,3].pwm,
                (byte)(heats[1,3].set_temp>>8),
                (byte)heats[1,3].set_temp,
                heats[1,4].info,
                heats[1,4].pwm,
                (byte)(heats[1,4].set_temp>>8),
                (byte)heats[1,4].set_temp,
                heats[1,5].info,
                heats[1,5].pwm,
                (byte)(heats[1,5].set_temp>>8),
                (byte)heats[1,5].set_temp,
                0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

                (byte)(bumps[2, 0].Speed >> 8),
                (byte)bumps[2, 0].Speed,
                (byte)(bumps[2, 0].SetPosition >> 8),
                (byte)bumps[2, 0].SetPosition,
                bumps[2, 0].info,
                bumps[2, 0].Port,
                (byte)(bumps[2, 1].Speed >> 8),
                (byte)bumps[2, 1].Speed,
                (byte)(bumps[2, 1].SetPosition >> 8),
                (byte)bumps[2, 1].SetPosition,
                bumps[2, 1].info,
                bumps[2, 1].Port,
                (byte)(bumps[2, 2].Speed >> 8),
                (byte)bumps[2, 2].Speed,
                (byte)(bumps[2, 2].SetPosition >> 8),
                (byte)bumps[2, 2].SetPosition,
                bumps[2, 2].info,
                bumps[2, 2].Port,
                (byte)(bumps[2, 3].Speed >> 8),
                (byte)bumps[2, 3].Speed,
                (byte)(bumps[2, 3].SetPosition >> 8),
                (byte)bumps[2, 3].SetPosition,
                bumps[2, 3].info,
                bumps[2, 3].Port,
                (byte)(bumps[2, 4].Speed >> 8),
                (byte)bumps[2, 4].Speed,
                (byte)(bumps[2, 4].SetPosition >> 8),
                (byte)bumps[2, 4].SetPosition,
                bumps[2, 4].info,
                bumps[2, 4].Port,
                (byte)(bumps[2, 5].Speed >> 8),
                (byte)bumps[2, 5].Speed,
                (byte)(bumps[2, 5].SetPosition >> 8),
                (byte)bumps[2, 5].SetPosition,
                bumps[2, 5].info,
                bumps[2, 5].Port,

                valves[2,0].info,
                valves[2,0].Port,
                valves[2,1].info,
                valves[2,1].Port,
                valves[2,2].info,
                valves[2,2].Port,
                valves[2,3].info,
                valves[2,3].Port,

                mfc[2].info,
                (byte)(mfc[2].set_speed>>8),
                (byte)mfc[2].set_speed,

                light[2].info,
                (byte)(light[2].set_strength>>8),
                (byte)light[2].set_strength,

                heats[2,0].info,
                heats[2,0].pwm,
                (byte)(heats[2,0].set_temp>>8),
                (byte)heats[2,0].set_temp,
                heats[2,1].info,
                heats[2,1].pwm,
                (byte)(heats[2,1].set_temp>>8),
                (byte)heats[2,1].set_temp,
                heats[2,2].info,
                heats[2,2].pwm,
                (byte)(heats[2,2].set_temp>>8),
                (byte)heats[2,2].set_temp,
                heats[2,3].info,
                heats[2,3].pwm,
                (byte)(heats[2,3].set_temp>>8),
                (byte)heats[2,3].set_temp,
                heats[2,4].info,
                heats[2,4].pwm,
                (byte)(heats[2,4].set_temp>>8),
                (byte)heats[2,4].set_temp,
                heats[2,5].info,
                heats[2,5].pwm,
                (byte)(heats[2,5].set_temp>>8),
                (byte)heats[2,5].set_temp,
                0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

                (byte)(bumps[3, 0].Speed >> 8),
                (byte)bumps[3, 0].Speed,
                (byte)(bumps[3, 0].SetPosition >> 8),
                (byte)bumps[3, 0].SetPosition,
                bumps[3, 0].info,
                bumps[3, 0].Port,
                (byte)(bumps[3, 1].Speed >> 8),
                (byte)bumps[3, 1].Speed,
                (byte)(bumps[3, 1].SetPosition >> 8),
                (byte)bumps[3, 1].SetPosition,
                bumps[3, 1].info,
                bumps[3, 1].Port,
                (byte)(bumps[3, 2].Speed >> 8),
                (byte)bumps[3, 2].Speed,
                (byte)(bumps[3, 2].SetPosition >> 8),
                (byte)bumps[3, 2].SetPosition,
                bumps[3, 2].info,
                bumps[3, 2].Port,
                (byte)(bumps[3, 3].Speed >> 8),
                (byte)bumps[3, 3].Speed,
                (byte)(bumps[3, 3].SetPosition >> 8),
                (byte)bumps[3, 3].SetPosition,
                bumps[3, 3].info,
                bumps[3, 3].Port,
                (byte)(bumps[3, 4].Speed >> 8),
                (byte)bumps[3, 4].Speed,
                (byte)(bumps[3, 4].SetPosition >> 8),
                (byte)bumps[3, 4].SetPosition,
                bumps[3, 4].info,
                bumps[3, 4].Port,
                (byte)(bumps[3, 5].Speed >> 8),
                (byte)bumps[3, 5].Speed,
                (byte)(bumps[3, 5].SetPosition >> 8),
                (byte)bumps[3, 5].SetPosition,

                bumps[3, 5].info,
                bumps[3, 5].Port,
                valves[3,0].info,
                valves[3,0].Port,
                valves[3,1].info,
                valves[3,1].Port,
                valves[3,2].info,
                valves[3,2].Port,
                valves[3,3].info,
                valves[3,3].Port,

                mfc[3].info,
                (byte)(mfc[3].set_speed>>8),
                (byte)mfc[3].set_speed,

                light[3].info,
                (byte)(light[3].set_strength>>8),
                (byte)light[3].set_strength,

                heats[3,0].info,
                heats[3,0].pwm,
                (byte)(heats[3,0].set_temp>>8),
                (byte)heats[3,0].set_temp,
                heats[3,1].info,
                heats[3,1].pwm,
                (byte)(heats[3,1].set_temp>>8),
                (byte)heats[3,1].set_temp,
                heats[3,2].info,
                heats[3,2].pwm,
                (byte)(heats[3,2].set_temp>>8),
                (byte)heats[3,2].set_temp,
                heats[3,3].info,
                heats[3,3].pwm,
                (byte)(heats[3,3].set_temp>>8),
                (byte)heats[3,3].set_temp,
                heats[3,4].info,
                heats[3,4].pwm,
                (byte)(heats[3,4].set_temp>>8),
                (byte)heats[3,4].set_temp,
                heats[3,5].info,
                heats[3,5].pwm,
                (byte)(heats[3,5].set_temp>>8),
                (byte)heats[3,5].set_temp,
                0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
                0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
                };

                byte[] sendBytes = header_bytes.Concat(data1).ToArray();
                // 发送数据
                sendClient.Send(sendBytes, sendBytes.Length, new IPEndPoint(remoteIp, remotePort));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"发送错误: {ex.Message}");
            }
        }

        private void button1_Click(object sender, EventArgs e)
        {
            if (button1.Text == "stop")
            {
                button1.Text = "continue";
                bumps[0, 0].info = (byte)(bumps[0, 0].info & 0b11111110);
            }
            else
            {
                button1.Text = "stop";
                bumps[0, 0].info = (byte)(bumps[0, 0].info | 0x01);
            }
        }


        private void numericUpDown1_ValueChanged(object sender, EventArgs e)
        {
            bumps[0,0].Speed = (ushort)numericUpDown1.Value;
        }

        private void numericUpDown6_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 1].Speed = (ushort)numericUpDown6.Value;
        }

        private void numericUpDown12_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 2].Speed = (ushort)numericUpDown12.Value;
        }

        private void numericUpDown9_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 3].Speed = (ushort)numericUpDown9.Value;
        }

        private void numericUpDown18_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 4].Speed = (ushort)numericUpDown18.Value;
        }

        private void numericUpDown15_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 5].Speed = (ushort)numericUpDown15.Value;
        }

        private void numericUpDown2_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 0].SetPosition = (ushort)numericUpDown2.Value;
        }

        private void numericUpDown5_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 1].SetPosition = (ushort)numericUpDown5.Value;
        }

        private void numericUpDown11_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 2].SetPosition = (ushort)numericUpDown11.Value;
        }

        private void numericUpDown8_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 3].SetPosition = (ushort)numericUpDown8.Value;
        }

        private void numericUpDown17_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 4].SetPosition = (ushort)numericUpDown17.Value;
        }

        private void numericUpDown14_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 5].SetPosition = (ushort)numericUpDown14.Value;
        }

        private void numericUpDown3_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 0].Port = (byte)numericUpDown3.Value;
        }

        private void numericUpDown4_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 1].Port = (byte)numericUpDown4.Value;
        }

        private void numericUpDown10_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 2].Port = (byte)numericUpDown10.Value;
        }

        private void numericUpDown7_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 3].Port = (byte)numericUpDown7.Value;
        }

        private void numericUpDown16_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 4].Port = (byte)numericUpDown16.Value;
        }

        private void numericUpDown13_ValueChanged(object sender, EventArgs e)
        {
            bumps[0, 5].Port = (byte)numericUpDown13.Value;
        }

        private void button2_Click(object sender, EventArgs e)
        {
            if (button2.Text == "stop")
            {
                button2.Text = "continue";
                bumps[0, 1].info = (byte)(bumps[0, 1].info & 0b11111110);
            }
            else
            {
                button2.Text = "stop";
                bumps[0, 1].info = (byte)(bumps[0, 1].info | 0x01);
            }
        }

        private void button3_Click(object sender, EventArgs e)
        {
            if (button3.Text == "stop")
            {
                button3.Text = "continue";
                bumps[0, 2].info = (byte)(bumps[0, 2].info & 0b11111110);
            }
            else
            {
                button3.Text = "stop";
                bumps[0, 2].info = (byte)(bumps[0, 2].info | 0x01);
            }
        }

        private void button4_Click(object sender, EventArgs e)
        {
            if (button4.Text == "stop")
            {
                button4.Text = "continue";
                bumps[0, 3].info = (byte)(bumps[0, 3].info & 0b11111110);
            }
            else
            {
                button4.Text = "stop";
                bumps[0, 3].info = (byte)(bumps[0, 3].info | 0x01);
            }
        }

        private void button5_Click(object sender, EventArgs e)
        {
            if (button5.Text == "stop")
            {
                button5.Text = "continue";
                bumps[0, 4].info = (byte)(bumps[0, 4].info & 0b11111110);
            }
            else
            {
                button5.Text = "stop";
                bumps[0, 4].info = (byte)(bumps[0, 4].info | 0x01);
            }
        }

        private void button6_Click(object sender, EventArgs e)
        {
            if (button6.Text == "stop")
            {
                button6.Text = "continue";
                bumps[0, 5].info = (byte)(bumps[0, 5].info & 0b11111110);
            }
            else
            {
                button6.Text = "stop";
                bumps[0, 5].info = (byte)(bumps[0, 5].info | 0x01);
            }
        }

        private void numericUpDown22_ValueChanged(object sender, EventArgs e)
        {
            valves[0, 0].Port = (byte)numericUpDown22.Value;
        }

        private void numericUpDown21_ValueChanged(object sender, EventArgs e)
        {
            valves[0, 1].Port = (byte)numericUpDown21.Value;
        }

        private void numericUpDown20_ValueChanged(object sender, EventArgs e)
        {
            valves[0, 2].Port = (byte)numericUpDown20.Value;
        }

        private void numericUpDown19_ValueChanged(object sender, EventArgs e)
        {
            valves[0, 3].Port = (byte)numericUpDown19.Value;
        }

        private void numericUpDown34_ValueChanged(object sender, EventArgs e)
        {
            heats[0,0].pwm = (byte)numericUpDown34.Value;
        }

        private void numericUpDown32_ValueChanged(object sender, EventArgs e)
        {
            heats[0,1].pwm = (byte)numericUpDown32.Value;
        }

        private void numericUpDown30_ValueChanged(object sender, EventArgs e)
        {
            heats[0,2].pwm = (byte)numericUpDown30.Value;  
        }

        private void numericUpDown28_ValueChanged(object sender, EventArgs e)
        {
            heats[0, 3].pwm = (byte)numericUpDown28.Value;
        }

        private void numericUpDown26_ValueChanged(object sender, EventArgs e)
        {
            heats[0, 4].pwm = (byte)numericUpDown26.Value;
        }

        private void numericUpDown24_ValueChanged(object sender, EventArgs e)
        {
            heats[0, 5].pwm = (byte)numericUpDown24.Value;
        }

        private void numericUpDown33_ValueChanged(object sender, EventArgs e)
        {
            heats[0, 0].set_temp = (ushort)(numericUpDown33.Value*1424/10+5360);
        }

        private void numericUpDown31_ValueChanged(object sender, EventArgs e)
        {
            heats[0, 1].set_temp = (ushort)(numericUpDown31.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown29_ValueChanged(object sender, EventArgs e)
        {
            heats[0, 2].set_temp = (ushort)(numericUpDown29.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown27_ValueChanged(object sender, EventArgs e)
        {
            heats[0, 3].set_temp = (ushort)(numericUpDown27.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown25_ValueChanged(object sender, EventArgs e)
        {
            heats[0, 4].set_temp = (ushort)(numericUpDown25.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown23_ValueChanged(object sender, EventArgs e)
        {
            heats[0, 5].set_temp = (ushort)(numericUpDown23.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown35_ValueChanged(object sender, EventArgs e)
        {
            //mfc
        }

        private void button22_Click(object sender, EventArgs e)
        {
            SendData();
        }

        private void numericUpDown72_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 0].Speed = (ushort)numericUpDown72.Value;
        }

        private void numericUpDown69_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 1].Speed = (ushort)numericUpDown69.Value;
        }

        private void numericUpDown66_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 2].Speed = (ushort)numericUpDown66.Value;
        }

        private void numericUpDown63_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 3].Speed = (ushort)numericUpDown63.Value;
        }

        private void numericUpDown60_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 4].Speed = (ushort)numericUpDown60.Value;
        }

        private void numericUpDown57_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 5].Speed = (ushort)numericUpDown57.Value;
        }

        private void numericUpDown71_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 0].SetPosition = (ushort)numericUpDown71.Value;
        }

        private void numericUpDown68_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 1].SetPosition = (ushort)numericUpDown68.Value;
        }

        private void numericUpDown65_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 2].SetPosition = (ushort)numericUpDown65.Value;
        }

        private void numericUpDown62_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 3].SetPosition = (ushort)numericUpDown62.Value;
        }

        private void numericUpDown59_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 4].SetPosition = (ushort)numericUpDown59.Value;
        }

        private void numericUpDown56_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 5].SetPosition = (ushort)numericUpDown56.Value;
        }

        private void numericUpDown70_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 0].Port = (byte)numericUpDown70.Value;
        }

        private void numericUpDown67_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 1].Port = (byte)numericUpDown67.Value;
        }

        private void numericUpDown64_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 2].Port = (byte)numericUpDown64.Value;
        }

        private void numericUpDown61_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 3].Port = (byte)numericUpDown61.Value;
        }

        private void numericUpDown58_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 4].Port = (byte)numericUpDown58.Value;
        }

        private void numericUpDown55_ValueChanged(object sender, EventArgs e)
        {
            bumps[1, 5].Port = (byte)numericUpDown55.Value;
        }

        private void button14_Click(object sender, EventArgs e)
        {
            if (button14.Text == "stop")
            {
                button14.Text = "continue";
                bumps[1, 0].info = (byte)(bumps[1, 0].info & 0b11111110);
            }
            else
            {
                button14.Text = "stop";
                bumps[1, 0].info = (byte)(bumps[1, 0].info | 0x01);
            }
        }

        private void button13_Click(object sender, EventArgs e)
        {
            if (button13.Text == "stop")
            {
                button13.Text = "continue";
                bumps[1, 1].info = (byte)(bumps[1, 1].info & 0b11111110);
            }
            else
            {
                button13.Text = "stop";
                bumps[1, 1].info = (byte)(bumps[1, 1].info | 0x01);
            }
        }

        private void button12_Click(object sender, EventArgs e)
        {
            if (button12.Text == "stop")
            {
                button12.Text = "continue";
                bumps[1, 2].info = (byte)(bumps[1, 2].info & 0b11111110);
            }
            else
            {
                button12.Text = "stop";
                bumps[1, 2].info = (byte)(bumps[1, 2].info | 0x01);
            }
        }

        private void button11_Click(object sender, EventArgs e)
        {
            if (button11.Text == "stop")
            {
                button11.Text = "continue";
                bumps[1, 3].info = (byte)(bumps[1, 3].info & 0b11111110);
            }
            else
            {
                button11.Text = "stop";
                bumps[1, 3].info = (byte)(bumps[1, 3].info | 0x01);
            }
        }

        private void button10_Click(object sender, EventArgs e)
        {
            if (button10.Text == "stop")
            {
                button10.Text = "continue";
                bumps[1, 4].info = (byte)(bumps[1, 4].info & 0b11111110);
            }
            else
            {
                button10.Text = "stop";
                bumps[1, 4].info = (byte)(bumps[1, 4].info | 0x01);
            }
        }

        private void button9_Click(object sender, EventArgs e)
        {
            if (button9.Text == "stop")
            {
                button9.Text = "continue";
                bumps[1, 5].info = (byte)(bumps[1, 5].info & 0b11111110);
            }
            else
            {
                button9.Text = "stop";
                bumps[1, 5].info = (byte)(bumps[1, 5].info | 0x01);
            }
        }

        private void numericUpDown54_ValueChanged(object sender, EventArgs e)
        {
            valves[1, 0].Port = (byte)numericUpDown54.Value;
        }

        private void numericUpDown53_ValueChanged(object sender, EventArgs e)
        {
            valves[1, 1].Port = (byte)numericUpDown53.Value;
        }

        private void numericUpDown52_ValueChanged(object sender, EventArgs e)
        {
            valves[1, 2].Port = (byte)numericUpDown52.Value;
        }

        private void numericUpDown51_ValueChanged(object sender, EventArgs e)
        {
            valves[1, 3].Port = (byte)numericUpDown51.Value;
        }

        private void numericUpDown50_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 0].pwm = (byte)numericUpDown50.Value;
        }

        private void numericUpDown48_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 1].pwm = (byte)numericUpDown48.Value;
        }

        private void numericUpDown46_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 2].pwm = (byte)numericUpDown46.Value;
        }

        private void numericUpDown44_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 3].pwm = (byte)numericUpDown44.Value;
        }

        private void numericUpDown42_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 4].pwm = (byte)numericUpDown42.Value;
        }

        private void numericUpDown40_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 5].pwm = (byte)numericUpDown40.Value;
        }

        private void numericUpDown49_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 0].set_temp = (ushort)(numericUpDown49.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown47_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 1].set_temp = (ushort)(numericUpDown47.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown45_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 2].set_temp = (ushort)(numericUpDown45.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown43_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 3].set_temp = (ushort)(numericUpDown43.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown41_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 4].set_temp = (ushort)(numericUpDown41.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown39_ValueChanged(object sender, EventArgs e)
        {
            heats[1, 5].set_temp = (ushort)(numericUpDown39.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown36_ValueChanged(object sender, EventArgs e)
        {
            //light0
        }

        private void numericUpDown38_ValueChanged(object sender, EventArgs e)
        {
            //mfc1
        }

        private void numericUpDown37_ValueChanged(object sender, EventArgs e)
        {
            //light1
        }

        private void numericUpDown108_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 0].Speed = (ushort)numericUpDown108.Value;
        }

        private void numericUpDown105_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 1].Speed = (ushort)numericUpDown105.Value;
        }

        private void numericUpDown102_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 2].Speed = (ushort)numericUpDown102.Value;
        }

        private void numericUpDown99_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 3].Speed = (ushort)numericUpDown99.Value;
        }

        private void numericUpDown96_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 4].Speed = (ushort)numericUpDown96.Value;
        }

        private void numericUpDown93_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 5].Speed = (ushort)numericUpDown93.Value;
        }

        private void numericUpDown107_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 0].SetPosition = (ushort)numericUpDown107.Value;
        }

        private void numericUpDown104_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 1].SetPosition = (ushort)numericUpDown104.Value;
        }

        private void numericUpDown101_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 2].SetPosition = (ushort)numericUpDown101.Value;
        }

        private void numericUpDown98_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 3].SetPosition = (ushort)numericUpDown98.Value;
        }

        private void numericUpDown95_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 4].SetPosition = (ushort)numericUpDown95.Value;
        }

        private void numericUpDown92_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 5].SetPosition = (ushort)numericUpDown92.Value;
        }

        private void numericUpDown106_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 0].Port = (byte)numericUpDown106.Value;
        }

        private void numericUpDown103_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 1].Port = (byte)numericUpDown103.Value;
        }

        private void numericUpDown100_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 2].Port = (byte)numericUpDown100.Value;
        }

        private void numericUpDown97_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 3].Port = (byte)numericUpDown97.Value;
        }

        private void numericUpDown94_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 4].Port = (byte)numericUpDown94.Value;
        }

        private void numericUpDown91_ValueChanged(object sender, EventArgs e)
        {
            bumps[2, 5].Port = (byte)numericUpDown91.Value;
        }

        private void button21_Click(object sender, EventArgs e)
        {
            if (button20.Text == "stop")
            {
                button20.Text = "continue";
                bumps[2, 0].info = (byte)(bumps[2, 0].info & 0b11111110);
            }
            else
            {
                button20.Text = "stop";
                bumps[2, 0].info = (byte)(bumps[2, 0].info | 0x01);
            }
        }

        private void button20_Click(object sender, EventArgs e)
        {
            if (button20.Text == "stop")
            {
                button20.Text = "continue";
                bumps[2, 1].info = (byte)(bumps[2, 1].info & 0b11111110);
            }
            else
            {
                button20.Text = "stop";
                bumps[2, 1].info = (byte)(bumps[2, 1].info | 0x01);
            }
        }

        private void button19_Click(object sender, EventArgs e)
        {
            if (button19.Text == "stop")
            {
                button19.Text = "continue";
                bumps[2, 2].info = (byte)(bumps[2, 2].info & 0b11111110);
            }
            else
            {
                button19.Text = "stop";
                bumps[2, 2].info = (byte)(bumps[2, 2].info | 0x01);
            }
        }

        private void button18_Click(object sender, EventArgs e)
        {
            if (button18.Text == "stop")
            {
                button18.Text = "continue";
                bumps[2,3].info = (byte)(bumps[2,3].info & 0b11111110);
            }
            else
            {
                button18.Text = "stop";
                bumps[2, 3].info = (byte)(bumps[2,3].info | 0x01);
            }
        }

        private void button17_Click(object sender, EventArgs e)
        {
            if (button17.Text == "stop")
            {
                button17.Text = "continue";
                bumps[2, 4].info = (byte)(bumps[2, 4].info & 0b11111110);
            }
            else
            {
                button17.Text = "stop";
                bumps[2, 4].info = (byte)(bumps[2, 4].info | 0x01);
            }
        }

        private void numericUpDown90_ValueChanged(object sender, EventArgs e)
        {
            valves[2, 0].Port = (byte)numericUpDown90.Value;
        }

        private void numericUpDown89_ValueChanged(object sender, EventArgs e)
        {
            valves[2, 1].Port = (byte)numericUpDown89.Value;
        }

        private void numericUpDown88_ValueChanged(object sender, EventArgs e)
        {
            valves[2, 2].Port = (byte)numericUpDown88.Value;
        }

        private void numericUpDown87_ValueChanged(object sender, EventArgs e)
        {
            valves[2, 3].Port = (byte)numericUpDown87.Value;
        }

        private void button16_Click(object sender, EventArgs e)
        {
            if (button16.Text == "stop")
            {
                button16.Text = "continue";
                bumps[2, 5].info = (byte)(bumps[2, 5].info & 0b11111110);
            }
            else
            {
                button16.Text = "stop";
                bumps[2, 5].info = (byte)(bumps[2, 5].info | 0x01);
            }
        }

        private void numericUpDown86_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 0].pwm = (byte)numericUpDown86.Value;
        }

        private void numericUpDown84_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 1].pwm = (byte)numericUpDown84.Value;
        }

        private void numericUpDown82_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 2].pwm = (byte)numericUpDown82.Value;
        }

        private void numericUpDown80_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 3].pwm = (byte)numericUpDown80.Value;
        }

        private void numericUpDown78_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 4].pwm = (byte)numericUpDown78.Value;
        }

        private void numericUpDown76_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 5].pwm = (byte)numericUpDown76.Value;
        }

        private void numericUpDown85_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 0].set_temp = (ushort)(numericUpDown85.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown83_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 1].set_temp = (ushort)(numericUpDown83.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown81_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 2].set_temp = (ushort)(numericUpDown81.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown79_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 3].set_temp = (ushort)(numericUpDown79.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown77_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 4].set_temp = (ushort)(numericUpDown77.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown75_ValueChanged(object sender, EventArgs e)
        {
            heats[2, 5].set_temp = (ushort)(numericUpDown75.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown74_ValueChanged(object sender, EventArgs e)
        {
            //mfc3
        }

        private void numericUpDown73_ValueChanged(object sender, EventArgs e)
        {
            //light3
        }

        private void numericUpDown144_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 0].Speed = (ushort)numericUpDown144.Value;
        }

        private void numericUpDown141_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 1].Speed = (ushort)numericUpDown141.Value;
        }

        private void numericUpDown138_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 2].Speed = (ushort)numericUpDown138.Value;
        }

        private void numericUpDown135_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 3].Speed = (ushort)numericUpDown135.Value;
        }

        private void numericUpDown132_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 4].Speed = (ushort)numericUpDown132.Value;
        }

        private void numericUpDown129_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 5].Speed = (ushort)numericUpDown129.Value;
        }

        private void numericUpDown143_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 0].SetPosition = (ushort)numericUpDown143.Value;
        }

        private void numericUpDown140_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 1].SetPosition = (ushort)numericUpDown140.Value;
        }

        private void numericUpDown137_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 2].SetPosition = (ushort)numericUpDown137.Value;
        }

        private void numericUpDown134_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 3].SetPosition = (ushort)numericUpDown134.Value;
        }

        private void numericUpDown131_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 4].SetPosition = (ushort)numericUpDown131.Value;
        }

        private void numericUpDown128_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 5].SetPosition = (ushort)numericUpDown128.Value;
        }

        private void numericUpDown142_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 0].Port = (byte)numericUpDown142.Value;
        }

        private void numericUpDown139_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 1].Port = (byte)numericUpDown139.Value;
        }

        private void numericUpDown136_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 2].Port = (byte)numericUpDown136.Value;
        }

        private void numericUpDown133_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 3].Port = (byte)numericUpDown133.Value;
        }

        private void numericUpDown130_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 4].Port = (byte)numericUpDown130.Value;
        }

        private void numericUpDown127_ValueChanged(object sender, EventArgs e)
        {
            bumps[3, 5].Port = (byte)numericUpDown127.Value;
        }

        private void button28_Click(object sender, EventArgs e)
        {
            if (button28.Text == "stop")
            {
                button28.Text = "continue";
                bumps[3, 0].info = (byte)(bumps[3, 0].info & 0b11111110);
            }
            else
            {
                button28.Text = "stop";
                bumps[3, 0].info = (byte)(bumps[3, 0].info | 0x01);
            }
        }

        private void button27_Click(object sender, EventArgs e)
        {
            if (button27.Text == "stop")
            {
                button27.Text = "continue";
                bumps[3, 1].info = (byte)(bumps[3, 1].info & 0b11111110);
            }
            else
            {
                button27.Text = "stop";
                bumps[3, 1].info = (byte)(bumps[3, 1].info | 0x01);
            }
        }

        private void button26_Click(object sender, EventArgs e)
        {
            if (button26.Text == "stop")
            {
                button26.Text = "continue";
                bumps[3, 2].info = (byte)(bumps[3, 2].info & 0b11111110);
            }
            else
            {
                button26.Text = "stop";
                bumps[3, 2].info = (byte)(bumps[3, 2].info | 0x01);
            }
        }

        private void button25_Click(object sender, EventArgs e)
        {
            if (button25.Text == "stop")
            {
                button25.Text = "continue";
                bumps[3, 3].info = (byte)(bumps[3, 3].info & 0b11111110);
            }
            else
            {
                button25.Text = "stop";
                bumps[3, 3].info = (byte)(bumps[3, 3].info | 0x01);
            }
        }

        private void button24_Click(object sender, EventArgs e)
        {
            if (button24.Text == "stop")
            {
                button24.Text = "continue";
                bumps[3, 4].info = (byte)(bumps[3, 4].info & 0b11111110);
            }
            else
            {
                button24.Text = "stop";
                bumps[3, 4].info = (byte)(bumps[3, 4].info | 0x01);
            }
        }

        private void button23_Click(object sender, EventArgs e)
        {
            if (button23.Text == "stop")
            {
                button23.Text = "continue";
                bumps[3, 5].info = (byte)(bumps[3, 5].info & 0b11111110);
            }
            else
            {
                button23.Text = "stop";
                bumps[3, 5].info = (byte)(bumps[3, 5].info | 0x01);
            }
        }

        private void numericUpDown126_ValueChanged(object sender, EventArgs e)
        {
            valves[3, 0].Port = (byte)numericUpDown126.Value;
        }

        private void numericUpDown125_ValueChanged(object sender, EventArgs e)
        {
            valves[3, 1].Port = (byte)numericUpDown125.Value;
        }

        private void numericUpDown124_ValueChanged(object sender, EventArgs e)
        {
            valves[3, 2].Port = (byte)numericUpDown124.Value;
        }

        private void numericUpDown123_ValueChanged(object sender, EventArgs e)
        {
            valves[3, 3].Port = (byte)numericUpDown123.Value;
        }

        private void numericUpDown122_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 0].pwm = (byte)numericUpDown122.Value;
        }

        private void numericUpDown120_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 1].pwm = (byte)numericUpDown120.Value;
        }

        private void numericUpDown118_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 2].pwm = (byte)numericUpDown118.Value;
        }

        private void numericUpDown116_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 3].pwm = (byte)numericUpDown116.Value;
        }

        private void numericUpDown114_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 4].pwm = (byte)numericUpDown114.Value;
        }

        private void numericUpDown112_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 5].pwm = (byte)numericUpDown112.Value;
        }

        private void numericUpDown121_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 0].set_temp = (ushort)(numericUpDown121.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown119_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 1].set_temp = (ushort)(numericUpDown119.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown117_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 2].set_temp = (ushort)(numericUpDown117.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown115_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 3].set_temp = (ushort)(numericUpDown115.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown113_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 4].set_temp = (ushort)(numericUpDown113.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown111_ValueChanged(object sender, EventArgs e)
        {
            heats[3, 5].set_temp = (ushort)(numericUpDown111.Value * 1424 / 10 + 5360);
        }

        private void numericUpDown110_ValueChanged(object sender, EventArgs e)
        {
            //mfc4
        }

        private void numericUpDown109_ValueChanged(object sender, EventArgs e)
        {
            //light4
        }
    }
    public class Bump
    {
        public byte info;
        public byte Port;
        public ushort Speed;// 0-6000
        public ushort SetPosition;// 0-24000
        public ushort Position;
    }

    public class Valve
    {
        public byte info;
        public byte Port;
    }
    public class Mfc
    {
        public byte info;
        public ushort set_speed;
        public ushort speed;
    }

    public class Light
    {
        public byte info;
        public ushort set_strength;
        public ushort current;
        public ushort voltage;
    }

    public class Heat
    {
        public byte info;
        public byte pwm;
        public ushort set_temp;
        public ushort temp;
    }
}
