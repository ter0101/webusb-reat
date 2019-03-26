import React, { Component } from 'react'

export default class usb extends Component {
  constructor(props) {
    super(props)

    this.USB_FILTERS = [
      {
        vendorId: 0x2d95,
        productId: 0x6003
      },
      {
        vendorId: 0x2fb8,
        productId: 0x21a6
      },
      {
        vendorId: 0x1520,
        productId: 0x0010
      }
    ]

    this.state = {
      connected: false,
      device: null,
      shouldRead: null,
      data: '',
      errorMsg: null
    }

    if (navigator.usb) {
      navigator.usb.getDevices({ filters: this.USB_FILTERS }).then(devices => {
        devices.forEach(device => {
          this.bindDevice(device)
        })

        navigator.usb.addEventListener('connect', e => {
          console.log('device connected', e)
          this.bindDevice(e.device)
        })

        navigator.usb.addEventListener('disconnect', e => {
          console.log('device lost', e)
          this.disconnect()
        })
      })

      this.connect = () => {
        navigator.usb
          .requestDevice({ filters: this.USB_FILTERS })
          .then(device => this.bindDevice(device))
          .catch(error => {
            console.error(error)
            this.disconnect()
          })
      }
    }
  }

  getData = () => {
    this.setState({ shouldRead: true })
    const { device } = this.state
    const {
      endpointNumber,
      packetSize
    } = device.configuration.interfaces[1].alternate.endpoints[0]
    console.log('getData')
    let readLoop = () => {
      device
        .transferIn(endpointNumber, packetSize)
        .then(result => {
          let data = new Uint8Array(result.data.buffer)

          this.setState({
            data: data
          })

          if (this.state.shouldRead) {
            readLoop()
          }
        })
        .catch(err => {
          console.error('USB Read Error', err)
        })
    }
    readLoop()
  }

  bindDevice = device => {
    device
      .open()
      .then(() => {
        console.log(
          `Connected ${device.productName} ${device.manufacturerName}`,
          device
        )
        this.setState({ connected: true, device: device })

        if (device.configuration === null) {
          return device.selectConfiguration(1)
        }
      })
      .then(() => device.claimInterface(1))
      .catch(err => {
        console.error('USB Error', err)
        this.setState({ errorMsg: err.message })
      })
  }

  disconnect() {
    this.setState({
      connected: false,
      device: null,
      shouldRead: null,
      data: '',
      errorMsg: null
    })
  }

  writeData = async () => {
    const { device } = this.state
    const {
      endpointNumber
    } = device.configuration.interfaces[1].alternate.endpoints[0]
    device.transferOut(endpointNumber,'a04')
    console.log('TRANSFEROUT:', 'RUN')
  }

  render() {
    const { device, connected, data } = this.state
    return (
      <div>
        <h1>Web Usb: {connected ? 'Online' : 'Offline'}</h1>
        {!device && <button onClick={this.connect}>Register Device</button>}
        <h2>{data}</h2>
        <button onClick={this.writeData}>write</button>
      </div>
    )
  }
}
