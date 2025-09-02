using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;
using System.Linq.Expressions;


namespace chem0530
{   
    public partial class Form1 : Form
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


        public Form1()
        {
            InitializeComponent();
            InitializeControls();
        }

        private void InitializeControls()
        {
            this.Text = "UDP 通信";
            this.Size = new System.Drawing.Size(600, 400);
            // 启动接收
            StartReceiving();
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
                            this.Invoke((MethodInvoker)delegate
                            {
                                ushort bump1_position = (ushort)((receivedBytes[32] << 8) | receivedBytes[33]);
                                ushort bump2_position = (ushort)((receivedBytes[38] << 8) | receivedBytes[39]);
                                ushort bump3_position = (ushort)((receivedBytes[44] << 8) | receivedBytes[45]);
                                ushort bump4_position = (ushort)((receivedBytes[50] << 8) | receivedBytes[51]);
                                ushort bump5_position = (ushort)((receivedBytes[56] << 8) | receivedBytes[57]);
                                ushort bump6_position = (ushort)((receivedBytes[62] << 8) | receivedBytes[63]);

                                ushort heat1 = (ushort)((receivedBytes[82] << 8) | receivedBytes[83]);
                                ushort heat2 = (ushort)((receivedBytes[86] << 8) | receivedBytes[87]);
                                ushort heat3 = (ushort)((receivedBytes[90] << 8) | receivedBytes[91]);
                                ushort heat4 = (ushort)((receivedBytes[94] << 8) | receivedBytes[95]);
                                ushort heat5 = (ushort)((receivedBytes[98] << 8) | receivedBytes[99]);
                                ushort heat6 = (ushort)((receivedBytes[102] << 8) | receivedBytes[103]);
                                switch (port)
                                {
                                    case 2020:
                                        {
                                            textBox1.Text = bump1_position.ToString();
                                            textBox2.Text = bump2_position.ToString();
                                            textBox3.Text = bump3_position.ToString();
                                            textBox4.Text = bump4_position.ToString();
                                            textBox5.Text = bump5_position.ToString();
                                            textBox6.Text = bump6_position.ToString();

                                            textBox30.Text = heat1.ToString();
                                            textBox29.Text = heat2.ToString();
                                            textBox28.Text = heat3.ToString();
                                            textBox27.Text = heat4.ToString();
                                            textBox26.Text = heat5.ToString();
                                            textBox25.Text = heat6.ToString();
                                            break;
                                        }
                                    case 2021:
                                        {
                                            textBox12.Text = bump1_position.ToString();
                                            textBox11.Text = bump2_position.ToString();
                                            textBox10.Text = bump3_position.ToString();
                                            textBox9.Text = bump4_position.ToString();
                                            textBox8.Text = bump5_position.ToString();
                                            textBox7.Text = bump6_position.ToString();

                                            textBox36.Text = heat1.ToString();
                                            textBox35.Text = heat2.ToString();
                                            textBox34.Text = heat3.ToString();
                                            textBox33.Text = heat4.ToString();
                                            textBox32.Text = heat5.ToString();
                                            textBox31.Text = heat6.ToString();
                                        }
                                        break;
                                    case 2022:
                                        {
                                            textBox18.Text = bump1_position.ToString();
                                            textBox17.Text = bump2_position.ToString();
                                            textBox16.Text = bump3_position.ToString();
                                            textBox15.Text = bump4_position.ToString();
                                            textBox14.Text = bump5_position.ToString();
                                            textBox13.Text = bump6_position.ToString();

                                            textBox42.Text = heat1.ToString();
                                            textBox41.Text = heat2.ToString();
                                            textBox40.Text = heat3.ToString();
                                            textBox39.Text = heat4.ToString();
                                            textBox38.Text = heat5.ToString();
                                            textBox37.Text = heat6.ToString();
                                            break;
                                        }
                                    case 2023:
                                        {
                                            textBox24.Text = bump1_position.ToString();
                                            textBox23.Text = bump2_position.ToString();
                                            textBox22.Text = bump3_position.ToString();
                                            textBox21.Text = bump4_position.ToString();
                                            textBox20.Text = bump5_position.ToString();
                                            textBox19.Text = bump6_position.ToString();

                                            textBox48.Text = heat1.ToString();
                                            textBox47.Text = heat2.ToString();
                                            textBox46.Text = heat3.ToString();
                                            textBox45.Text = heat4.ToString();
                                            textBox44.Text = heat5.ToString();
                                            textBox43.Text = heat6.ToString();
                                            break;
                                        }
                                    default:
                                        Console.WriteLine(port.ToString());
                                        break;
                                }
                            });
                        }
                        catch (SocketException ex)
                        {
                            if (isRunning)
                            {
                                this.Invoke((MethodInvoker)delegate
                                {
                                    Console.WriteLine(ex);
                                });
                            }
                        }
                    }
                }, client);
            }
        }




        private void Form1_Load(object sender, EventArgs e)
        {

        }
    }
}
