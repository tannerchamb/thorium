import React, { Component } from "react";
import gql from "graphql-tag";
import { graphql, withApollo } from "react-apollo";
import { Container, Row, Col, Card, CardBody, Button } from "reactstrap";
import Tour from "helpers/tourHelper";
import { Asset } from "helpers/assets";
import Decompress from "./Decompress";
import Door from "./Door";
import { Clamps } from "../Docking/graphics";
import "./style.scss";
import SubscriptionHelper from "helpers/subscriptionHelper";
import DamageOverlay from "../helpers/DamageOverlay";

const SHUTTLE_SUB = gql`
  subscription ShuttlesUpdate($simulatorId: ID) {
    dockingUpdate(simulatorId: $simulatorId, type: shuttlebay) {
      id
      name
      clamps
      compress
      doors
      image
      docked
      damage {
        damaged
      }
      direction
    }
  }
`;

const trainingSteps = [
  {
    selector: ".shuttles-card",
    content:
      "Shuttles are small ships which can be stored inside of your ship. Most shuttles are piloted and can transport large amounts of supplies or personnel great distances."
  },
  {
    selector: ".clamps-button",
    content:
      "To undock a shuttle, you must first release the docking clamps which hold the shuttle in place with this button."
  },
  {
    selector: ".compress-button",
    content:
      "Then, you must decompress the shuttlebay. To board the shuttle, there must be air inside the shuttlebay. However, if the shuttlebay doors are opened without decompressing the shuttlebay, all of that air would be sucked into space. The change in pressure would also pull people and equipment into space as well, so decompressing the shuttlebay is an important safety step."
  },
  {
    selector: ".doors-button",
    content:
      "Finally, you can open the shuttlebay doors. Once the image of the shuttle disappears, you can know that the shuttle has disembarked from your ship."
  },
  {
    selector: ".nothing",
    content: "To dock a shuttle, follow the steps in the opposite order."
  }
];
class Shuttles extends Component {
  render() {
    if (this.props.data.loading || !this.props.data.docking) return null;
    const { docking } = this.props.data;
    if (!docking) return null;
    return (
      <Container fluid className="shuttles-card">
        <SubscriptionHelper
          subscribe={() =>
            this.props.data.subscribeToMore({
              document: SHUTTLE_SUB,
              variables: {
                simulatorId: this.props.simulator.id
              },
              updateQuery: (previousResult, { subscriptionData }) => {
                return Object.assign({}, previousResult, {
                  docking: subscriptionData.data.dockingUpdate
                });
              }
            })
          }
        />
        {
          <Row>
            {docking.map((d, i) => (
              <div className="shuttleBay" key={d.id}>
                <ShuttleBay
                  {...d}
                  i={i}
                  client={this.props.client}
                  simulatorId={this.props.simulator.id}
                />
              </div>
            ))}
          </Row>
        }
        <Tour steps={trainingSteps} client={this.props.clientObj} />
      </Container>
    );
  }
}

class ShuttleBay extends Component {
  state = { animating: null };
  toggleShuttle = (id, which) => {
    this.setState({ animating: which });
    const mutation = gql`
      mutation UpdateShuttleBay($port: DockingPortInput!) {
        updateDockingPort(port: $port)
      }
    `;
    const port = {
      id
    };
    port[which] = !this.props[which];
    this.props.client.mutate({
      mutation,
      variables: { port }
    });
    if (this.clearTimeoutId) clearTimeout(this.clearTimeoutId);
    this.clearTimeoutId = setTimeout(
      () => this.setState({ animating: null }),
      4000
    );
  };
  updateShuttle = (id, which, value) => {
    const mutation = gql`
      mutation UpdateShuttleBay($port: DockingPortInput!) {
        updateDockingPort(port: $port)
      }
    `;
    const port = {
      id
    };
    port[which] = value;
    this.props.client.mutate({
      mutation,
      variables: { port }
    });
  };
  render() {
    const {
      docked,
      image,
      name,
      simulatorId,
      i,
      id,
      clamps,
      compress,
      doors,
      damage,
      direction
    } = this.props;
    const { animating } = this.state;

    let hint = '';
    if(!animating) {
      if(direction === 'departing') {
        if(clamps) hint = 'clamps';
        else if(compress) hint = 'compress';
        else if(doors) hint = 'doors';
      }
      else if (direction === 'arriving' && !docked) {
        if(clamps) hint = 'clamps';
        else if(compress) hint = 'compress';
        else if(doors) hint = 'doors';
      }
      else if (direction === 'arriving' && docked) {
        if(!doors) hint = 'doors';
        else if(!compress) hint = 'compress';
        else if(!clamps) hint = 'clamps';
      }
    }
    // Also add close out procedure after a shuttle has departed?

    return (
      <Card>
        <DamageOverlay system={{ damage }} message={`${name} Offline`} />
        <CardBody>
          <h3 className="text-center">{name}</h3>
          
          <Row>
            <Col sm={7}>
              {direction === "unspecified" && docked &&
              <Button
                block
                className="departure-button"
                color="success"
                onClick={() => this.updateShuttle(id, "direction", "departing")}
                >
                Prepare for departure
              </Button>
              }
              {direction === "departing" && docked &&
              <Button
                block
                className="departure-button"
                color="danger"
                onClick={() => this.updateShuttle(id, "direction", "unspecified")}
                >
                Abort departure sequence
              </Button>
              }
              <div className='docking-icon-wrapper'>
                <div className='docking-icon'>
                  <Clamps transform={clamps}/>
                </div>
                <Button
                  block
                  className="clamps-button"
                  disabled={!!animating}
                  color="primary"
                  onClick={() => this.toggleShuttle(id, "clamps")}
                  >
                  {clamps ? "Detach" : "Attach"} Clamps
                </Button>
                <div className={`docking-hint ${hint !== 'clamps' ? 'hidden' : ''}`}/>
              </div>
              <div className='docking-icon-wrapper'>
                <div className='docking-icon'>
                  <Decompress on={compress} />
                </div>              
                <Button
                  block
                  disabled={!!animating || !doors}
                  color="primary"
                  className="compress-button"
                  onClick={() => this.toggleShuttle(id, "compress")}
                >
                  {compress ? "Decompress" : "Compress"}
                </Button>
                <div className={`docking-hint ${hint !== 'compress' ? 'hidden' : ''}`}/>
              </div>
              <div className='docking-icon-wrapper'>
                <div className='docking-icon'>
                  <Door open={!doors} number={"0" + (i + 1)} />
                </div>
                <Button
                  block
                  disabled={!!animating || compress}
                  color="primary"
                  className="doors-button"
                  onClick={() => this.toggleShuttle(id, "doors")}
                >
                  {doors ? "Open" : "Close"} Doors
                </Button>
                <div className={`docking-hint ${hint !== 'doors' ? 'hidden' : ''}`}/>
              </div>
            </Col>
            <Col sm={5}>
              {animating === "clamps" && <Clamps transform={clamps} />}
              {animating === "compress" && <Decompress on={compress} />}
              {animating === "doors" && (
                <Door open={!doors} number={"0" + (i + 1)} />
              )}
              {docked ? (
                <Asset asset={image} simulatorId={simulatorId}>
                  {({ src }) => (
                    <div
                      className="picture shuttle"
                      style={{
                        backgroundImage: `url('${src}')`,
                        display: !animating ? "flex" : "none"
                      }}
                    >
                      <div className="spacer" />
                    </div>
                  )}
                </Asset>
              ) : (
                <div
                  style={{ display: !animating ? "flex" : "none" }}
                  className="shuttle"
                >
                  <h2>Shuttlebay Empty</h2>
                  <div className="spacer" />
                </div>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>
    );
  }
}

const SHUTTLE_QUERY = gql`
  query Shuttles($simulatorId: ID) {
    docking(simulatorId: $simulatorId, type: shuttlebay) {
      id
      name
      clamps
      compress
      doors
      image
      docked
      damage {
        damaged
      }
      direction
    }
  }
`;
export default graphql(SHUTTLE_QUERY, {
  options: ownProps => ({
    fetchPolicy: "cache-and-network",

    variables: {
      simulatorId: ownProps.simulator.id
    }
  })
})(withApollo(Shuttles));
